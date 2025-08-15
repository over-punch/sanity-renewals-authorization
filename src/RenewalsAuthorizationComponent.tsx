import React, { useState, useEffect } from 'react';
import { Box, Card, Text, Button, Flex, Stack, TextInput, Badge, Spinner, Select } from '@sanity/ui';
import { useClient } from 'sanity';

interface RenewalsAuthorizationProps {
	onClose?: () => void;
}

interface OrderSummary {
	_id: string;
	orderNumber: string;
	customerName: string;
	customerEmail: string;
	total: number;
	status: string;
	createdAt: string;
}

interface CartData {
	_id: string;
	items: any[];
	customer: {
		firstName: string;
		lastName: string;
		email: string;
		company?: string;
	};
	totals: {
		subtotal: number;
		discount: number;
		tax: number;
		total: number;
	};
}

interface AdditionalLineItem {
	title: string;
	description: string;
	quantity: number;
	price: number;
}

const RenewalsAuthorizationComponent: React.FC<RenewalsAuthorizationProps> = ({ onClose }) => {
	const client = useClient();
	const [loading, setLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [cartUrl, setCartUrl] = useState('');
	const [effectiveDate, setEffectiveDate] = useState('');
	const [supersededDocNumber, setSupersededDocNumber] = useState('');
	const [foundOrders, setFoundOrders] = useState<OrderSummary[]>([]);
	const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
	const [importedCart, setImportedCart] = useState<CartData | null>(null);
	const [additionalItems, setAdditionalItems] = useState<AdditionalLineItem[]>([]);
	const [discountCode, setDiscountCode] = useState('');
	const [renewalTotals, setRenewalTotals] = useState({
		subtotal: 0,
		discount: 0,
		tax: 0,
		total: 0,
	});

	// Search for orders
	const searchOrders = async () => {
		if (!searchQuery.trim()) return;

		setLoading(true);
		try {
			const query = `*[_type == "order" && (
				orderNumber match "${searchQuery}*" ||
				customer->firstName match "${searchQuery}*" ||
				customer->lastName match "${searchQuery}*" ||
				customer->email match "${searchQuery}*"
			)] {
				_id,
				orderNumber,
				"customerName": customer->firstName + " " + customer->lastName,
				"customerEmail": customer->email,
				"total": pricing.total,
				status,
				"createdAt": _createdAt
			} | order(_createdAt desc) [0...10]`;

			const orders = await client.fetch(query);
			setFoundOrders(orders);
		} catch (error) {
			console.error('Error searching orders:', error);
		} finally {
			setLoading(false);
		}
	};

	// Import cart from URL
	const importCartFromUrl = async () => {
		if (!cartUrl.trim()) return;

		setLoading(true);
		try {
			// Extract cart ID from URL
			const cartIdMatch = cartUrl.match(/cart=([^&]+)/);
			if (!cartIdMatch) {
				alert('Invalid cart URL format');
				return;
			}

			const cartId = cartIdMatch[1];
			const query = `*[_type == "cart" && _id == "${cartId}"][0] {
				_id,
				items,
				customer,
				totals
			}`;

			const cart = await client.fetch(query);
			if (!cart) {
				alert('Cart not found');
				return;
			}

			setImportedCart(cart);
			calculateTotals();
		} catch (error) {
			console.error('Error importing cart:', error);
			alert('Error importing cart');
		} finally {
			setLoading(false);
		}
	};

	// Create renewal order from selected data
	const createRenewalOrder = async () => {
		if (!selectedOrder && !importedCart) {
			alert('Please select an order or import a cart first');
			return;
		}

		setLoading(true);
		try {
			const renewalOrderData = {
				_type: 'order',
				orderType: 'renewal',
				orderNumber: `REN-${Date.now()}`,
				originalOrderRef: selectedOrder ? { _ref: selectedOrder._id } : undefined,
				renewalInfo: {
					effectiveDate: effectiveDate || undefined,
					supersededDocNumber: supersededDocNumber || undefined,
				},
				items: importedCart?.items || [],
				additionalLineItems: additionalItems.length > 0 ? additionalItems : undefined,
				customer: importedCart?.customer ? {
					firstName: importedCart.customer.firstName,
					lastName: importedCart.customer.lastName,
					email: importedCart.customer.email,
					company: importedCart.customer.company,
				} : undefined,
				pricing: renewalTotals,
				status: 'pending',
				paymentStatus: 'pending',
				fulfillmentStatus: 'not_fulfilled',
				discountCode: discountCode || undefined,
			};

			const result = await client.create(renewalOrderData);
			alert(`Renewal order created successfully: ${result._id}`);
			
			// Reset form
			setSelectedOrder(null);
			setImportedCart(null);
			setAdditionalItems([]);
			setDiscountCode('');
			setEffectiveDate('');
			setSupersededDocNumber('');
			setCartUrl('');
			setSearchQuery('');
		} catch (error) {
			console.error('Error creating renewal order:', error);
			alert('Error creating renewal order');
		} finally {
			setLoading(false);
		}
	};

	// Calculate renewal totals
	const calculateTotals = () => {
		let subtotal = importedCart?.totals.subtotal || 0;
		
		// Add additional items
		const additionalTotal = additionalItems.reduce((sum, item) => {
			return sum + (item.price * item.quantity);
		}, 0);

		subtotal += additionalTotal;

		// Apply basic calculations (simplified)
		const discount = 0; // Would apply discount code logic here
		const tax = subtotal * 0.08; // Simplified tax calculation
		const total = subtotal - discount + tax;

		setRenewalTotals({
			subtotal,
			discount,
			tax,
			total,
		});
	};

	// Add additional line item
	const addAdditionalItem = () => {
		setAdditionalItems([
			...additionalItems,
			{
				title: '',
				description: '',
				quantity: 1,
				price: 0,
			},
		]);
	};

	// Update additional line item
	const updateAdditionalItem = (index: number, field: string, value: any) => {
		const updated = [...additionalItems];
		updated[index] = { ...updated[index], [field]: value };
		setAdditionalItems(updated);
		calculateTotals();
	};

	// Remove additional line item
	const removeAdditionalItem = (index: number) => {
		setAdditionalItems(additionalItems.filter((_, i) => i !== index));
		calculateTotals();
	};

	useEffect(() => {
		calculateTotals();
	}, [importedCart, additionalItems]);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(amount);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString();
	};

	return (
		<Box padding={4}>
			<Flex justify="space-between" align="center" marginBottom={4}>
				<Text size={3} weight="bold">Renewals Authorization</Text>
				{onClose && (
					<Button mode="ghost" text="Close" onClick={onClose} />
				)}
			</Flex>

			<Flex gap={4}>
				{/* Main Form */}
				<Box flex={2}>
					<Stack space={4}>
						{/* Renewal Information */}
						<Card padding={4} radius={2} shadow={1}>
							<Text size={2} weight="semibold" marginBottom={3}>Renewal Information</Text>
							<Stack space={3}>
								<Box>
									<Text size={1} weight="medium" marginBottom={2}>Effective Date (Optional)</Text>
									<TextInput
										type="date"
										value={effectiveDate}
										onChange={(event) => setEffectiveDate(event.target.value)}
										placeholder="Select effective date"
									/>
								</Box>
								<Box>
									<Text size={1} weight="medium" marginBottom={2}>Superseded Document Number</Text>
									<TextInput
										value={supersededDocNumber}
										onChange={(event) => setSupersededDocNumber(event.target.value)}
										placeholder="Enter document number being renewed"
									/>
								</Box>
							</Stack>
						</Card>

						{/* Cart Import */}
						<Card padding={4} radius={2} shadow={1}>
							<Text size={2} weight="semibold" marginBottom={3}>Import Cart Data</Text>
							<Stack space={3}>
								<Box>
									<Text size={1} weight="medium" marginBottom={2}>Cart URL</Text>
									<Flex gap={2}>
										<TextInput
											flex={1}
											value={cartUrl}
											onChange={(event) => setCartUrl(event.target.value)}
											placeholder="Paste checkout cart URL here"
										/>
										<Button
											text="Import"
											tone="primary"
											onClick={importCartFromUrl}
											disabled={!cartUrl.trim() || loading}
										/>
									</Flex>
								</Box>
							</Stack>
						</Card>

						{/* Order Search */}
						<Card padding={4} radius={2} shadow={1}>
							<Text size={2} weight="semibold" marginBottom={3}>Or Search Existing Orders</Text>
							<Stack space={3}>
								<Box>
									<Flex gap={2}>
										<TextInput
											flex={1}
											value={searchQuery}
											onChange={(event) => setSearchQuery(event.target.value)}
											placeholder="Search by order number, name, or email"
										/>
										<Button
											text="Search"
											tone="primary"
											onClick={searchOrders}
											disabled={!searchQuery.trim() || loading}
										/>
									</Flex>
								</Box>

								{foundOrders.length > 0 && (
									<Box>
										<Text size={1} weight="medium" marginBottom={2}>Found Orders</Text>
										<Stack space={2}>
											{foundOrders.map((order) => (
												<Card
													key={order._id}
													padding={3}
													radius={2}
													shadow={1}
													tone={selectedOrder?._id === order._id ? 'primary' : 'default'}
												>
													<Flex justify="space-between" align="center">
														<Stack space={1}>
															<Text size={1} weight="semibold">
																{order.orderNumber}
															</Text>
															<Text size={1} muted>
																{order.customerName} ({order.customerEmail})
															</Text>
															<Text size={1} muted>
																{formatCurrency(order.total)} - {formatDate(order.createdAt)}
															</Text>
														</Stack>
														<Button
															text={selectedOrder?._id === order._id ? "Selected" : "Select"}
															tone={selectedOrder?._id === order._id ? "positive" : "primary"}
															mode={selectedOrder?._id === order._id ? "ghost" : "default"}
															size={1}
															onClick={() => setSelectedOrder(order)}
														/>
													</Flex>
												</Card>
											))}
										</Stack>
									</Box>
								)}
							</Stack>
						</Card>

						{/* Additional Line Items */}
						<Card padding={4} radius={2} shadow={1}>
							<Flex justify="space-between" align="center" marginBottom={3}>
								<Text size={2} weight="semibold">Additional Line Items</Text>
								<Button
									text="Add Item"
									tone="primary"
									size={1}
									onClick={addAdditionalItem}
								/>
							</Flex>
							{additionalItems.length > 0 && (
								<Stack space={3}>
									{additionalItems.map((item, index) => (
										<Card key={index} padding={3} radius={2} tone="transparent">
											<Stack space={2}>
												<Flex gap={2}>
													<TextInput
														flex={1}
														value={item.title}
														onChange={(event) => updateAdditionalItem(index, 'title', event.target.value)}
														placeholder="Item title"
													/>
													<Button
														text="×"
														mode="ghost"
														tone="critical"
														onClick={() => removeAdditionalItem(index)}
													/>
												</Flex>
												<TextInput
													value={item.description}
													onChange={(event) => updateAdditionalItem(index, 'description', event.target.value)}
													placeholder="Description (optional)"
												/>
												<Flex gap={2}>
													<TextInput
														flex={1}
														type="number"
														value={item.quantity.toString()}
														onChange={(event) => updateAdditionalItem(index, 'quantity', parseInt(event.target.value) || 1)}
														placeholder="Qty"
													/>
													<TextInput
														flex={2}
														type="number"
														step="0.01"
														value={item.price.toString()}
														onChange={(event) => updateAdditionalItem(index, 'price', parseFloat(event.target.value) || 0)}
														placeholder="Price"
													/>
												</Flex>
											</Stack>
										</Card>
									))}
								</Stack>
							)}
						</Card>

						{/* Discount Code */}
						<Card padding={4} radius={2} shadow={1}>
							<Text size={2} weight="semibold" marginBottom={3}>Discount Code</Text>
							<TextInput
								value={discountCode}
								onChange={(event) => setDiscountCode(event.target.value)}
								placeholder="Enter discount code (optional)"
							/>
						</Card>
					</Stack>
				</Box>

				{/* Summary Sidebar */}
				<Box flex={1}>
					<Card padding={4} radius={2} shadow={1} style={{ position: 'sticky', top: 20 }}>
						<Text size={2} weight="semibold" marginBottom={3}>Renewal Summary</Text>
						
						{/* Selected Order/Cart Info */}
						{(selectedOrder || importedCart) && (
							<Box marginBottom={4}>
								<Text size={1} weight="medium" marginBottom={2}>Source</Text>
								{selectedOrder && (
									<Badge tone="primary" fontSize={0}>
										Order: {selectedOrder.orderNumber}
									</Badge>
								)}
								{importedCart && (
									<Badge tone="positive" fontSize={0}>
										Cart: {importedCart._id.slice(-6)}
									</Badge>
								)}
							</Box>
						)}

						{/* Customer Info */}
						{importedCart?.customer && (
							<Box marginBottom={4}>
								<Text size={1} weight="medium" marginBottom={2}>Customer</Text>
								<Text size={1}>
									{importedCart.customer.firstName} {importedCart.customer.lastName}
								</Text>
								<Text size={1} muted>{importedCart.customer.email}</Text>
								{importedCart.customer.company && (
									<Text size={1} muted>{importedCart.customer.company}</Text>
								)}
							</Box>
						)}

						{/* Renewal Details */}
						{(effectiveDate || supersededDocNumber) && (
							<Box marginBottom={4}>
								<Text size={1} weight="medium" marginBottom={2}>Renewal Details</Text>
								{effectiveDate && (
									<Text size={1}>Effective: {formatDate(effectiveDate)}</Text>
								)}
								{supersededDocNumber && (
									<Text size={1}>Supersedes: {supersededDocNumber}</Text>
								)}
							</Box>
						)}

						{/* Pricing */}
						<Box marginBottom={4}>
							<Text size={1} weight="medium" marginBottom={2}>Pricing</Text>
							<Stack space={1}>
								<Flex justify="space-between">
									<Text size={1}>Subtotal:</Text>
									<Text size={1}>{formatCurrency(renewalTotals.subtotal)}</Text>
								</Flex>
								{renewalTotals.discount > 0 && (
									<Flex justify="space-between">
										<Text size={1}>Discount:</Text>
										<Text size={1} tone="positive">-{formatCurrency(renewalTotals.discount)}</Text>
									</Flex>
								)}
								<Flex justify="space-between">
									<Text size={1}>Tax:</Text>
									<Text size={1}>{formatCurrency(renewalTotals.tax)}</Text>
								</Flex>
								<Flex justify="space-between" style={{ borderTop: '1px solid var(--card-border-color)', paddingTop: 8 }}>
									<Text size={1} weight="semibold">Total:</Text>
									<Text size={1} weight="semibold">{formatCurrency(renewalTotals.total)}</Text>
								</Flex>
							</Stack>
						</Box>

						{/* Actions */}
						<Stack space={2}>
							<Button
								text={loading ? "Processing..." : "Create Renewal Order"}
								tone="primary"
								onClick={createRenewalOrder}
								disabled={loading || (!selectedOrder && !importedCart)}
								icon={loading ? () => <Spinner muted size={1} /> : undefined}
							/>
							<Button
								text="Generate Cart URL"
								mode="ghost"
								onClick={() => alert('Cart URL generation would be implemented here')}
								disabled={!importedCart}
							/>
						</Stack>
					</Card>
				</Box>
			</Flex>
		</Box>
	);
};

export default RenewalsAuthorizationComponent;
