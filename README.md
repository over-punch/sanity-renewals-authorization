# Sanity Renewals Authorization

A comprehensive renewal order management system for subscription-based businesses in Sanity Studio. Streamlines the process of creating renewal orders from existing carts or past orders with advanced pricing calculations and customer management.

## Features

- **🔄 Cart Lookup & Validation**: Import existing cart data via URL or reference past orders
- **📋 Interactive Renewal Forms**: User-friendly interface with autocomplete and validation
- **💰 Dynamic Pricing Calculations**: Real-time pricing with discount support and additional line items
- **📊 Order Summary Sidebar**: Live preview of renewal contents and totals
- **🔍 Smart Search**: Find orders by number, customer name, or email
- **📅 Effective Date Management**: Set custom effective dates for renewals
- **📄 Document Supersession**: Track which documents are being renewed
- **➕ Additional Line Items**: Add custom charges, fees, or services
- **🎫 Discount Code Integration**: Apply and create discount codes on the fly
- **📱 Responsive Design**: Works seamlessly across desktop and mobile

## Installation

```bash
npm install sanity-renewals-authorization
```

## Quick Start

### Add to Sanity Studio

```javascript
// sanity.config.js
import { Renewals } from 'sanity-renewals-authorization'

export default defineConfig({
  // ... other config
  tools: [
    Renewals()
  ]
})
```

### Environment Configuration

```bash
# Enable renewals tool
SANITY_STUDIO_RENEWALS_ENABLED=true

# Site URL for cart generation
SANITY_STUDIO_SITE_URL=https://yourdomain.com
```

## Usage

### Basic Renewal Workflow

1. **Access Renewals Tool**: Navigate to the Renewals tab in Sanity Studio
2. **Set Renewal Information**: 
   - Enter effective date (optional)
   - Specify superseded document number
3. **Import Cart Data**:
   - Paste cart URL from existing checkout
   - OR search and select from past orders
4. **Add Additional Items**: Include extra charges or services
5. **Apply Discounts**: Search existing codes or create new ones
6. **Generate Renewal Cart**: Create shareable checkout URL

### Cart URL Import

```javascript
// Supported cart URL format
https://yourdomain.com/checkout/licenseeInfo?cart=cart-id-here
```

### Order Search

Search past orders by:
- Order number: `#12345`
- Customer name: `John Smith`
- Email address: `customer@example.com`

## Schema Requirements

### Enhanced Order Schema

```javascript
export default {
  name: 'order',
  type: 'document',
  fields: [
    // ... existing fields
    {
      title: 'Order Type',
      name: 'orderType',
      type: 'string',
      options: {
        list: [
          { title: 'Regular Order', value: 'regular' },
          { title: 'Renewal Order', value: 'renewal' }
        ]
      },
      initialValue: 'regular'
    },
    {
      title: 'Original Order Reference',
      name: 'originalOrderRef',
      type: 'reference',
      to: [{ type: 'order' }],
      hidden: ({ parent }) => parent?.orderType !== 'renewal'
    },
    {
      title: 'Renewal Information',
      name: 'renewalInfo',
      type: 'object',
      hidden: ({ parent }) => parent?.orderType !== 'renewal',
      fields: [
        {
          title: 'Effective Date',
          name: 'effectiveDate',
          type: 'date'
        },
        {
          title: 'Superseded Document Number',
          name: 'supersededDocNumber',
          type: 'string'
        }
      ]
    },
    {
      title: 'Additional Line Items',
      name: 'additionalLineItems',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          {
            title: 'Title',
            name: 'title',
            type: 'string',
            validation: Rule => Rule.required()
          },
          {
            title: 'Description',
            name: 'description',
            type: 'text'
          },
          {
            title: 'Quantity',
            name: 'quantity',
            type: 'number',
            initialValue: 1
          },
          {
            title: 'Price (USD)',
            name: 'price',
            type: 'number'
          }
        ]
      }]
    }
  ]
}
```

### Enhanced Cart Schema

```javascript
export default {
  name: 'cart',
  type: 'document',
  fields: [
    // ... existing fields
    {
      title: 'Renewal Information',
      name: 'renewalInfo',
      type: 'object',
      fields: [
        {
          title: 'Effective Date',
          name: 'effectiveDate',
          type: 'date'
        },
        {
          title: 'Superseded Document Number',
          name: 'supersededDocNumber',
          type: 'string'
        }
      ]
    },
    {
      title: 'Additional Line Items',
      name: 'additionalLineItems',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          {
            title: 'Title',
            name: 'title',
            type: 'string'
          },
          {
            title: 'Description',
            name: 'description',
            type: 'text'
          },
          {
            title: 'Quantity',
            name: 'quantity',
            type: 'number'
          },
          {
            title: 'Price (USD)',
            name: 'price',
            type: 'number'
          }
        ]
      }]
    }
  ]
}
```

## Features in Detail

### Cart Data Import
- **URL Validation**: Ensures cart URLs are properly formatted
- **Data Fetching**: Retrieves complete cart information including customer details
- **Preview Display**: Shows imported data in organized sections
- **Error Handling**: Clear feedback for invalid or missing carts

### Order Reference System
- **Smart Search**: Multi-field search across order numbers, names, and emails
- **Order Preview**: Display order contents and customer information
- **One-Click Import**: Use existing order items as renewal base
- **Reference Tracking**: Maintain links between original and renewal orders

### Pricing Engine
- **Real-time Calculations**: Live updates as items are added or modified
- **Discount Integration**: Support for percentage and fixed-amount discounts
- **Additional Items**: Custom line items with quantity and pricing
- **Tax Handling**: Configurable tax calculations
- **Currency Support**: Multi-currency pricing support

### User Interface
- **Responsive Sidebar**: Collapsible order summary with live updates
- **Form Validation**: Real-time validation with helpful error messages
- **Autocomplete**: Smart suggestions for orders and discount codes
- **Progress Indicators**: Clear feedback during processing
- **Accessibility**: Full keyboard navigation and screen reader support

## API Integration

### Required Utility Functions

```javascript
// src/utils.js
export const calculateSelectedStylesPrice = (selectedFonts, collections, licenses, subFamilies) => {
  // Your pricing calculation logic
}

export const calculateTotalTypefacePrice = (priceObj) => {
  // Your total calculation logic
}
```

### Custom Hooks

```javascript
// hooks/useSanityClient.js
import { useClient } from 'sanity'

export const useSanityClient = () => {
  return useClient({ apiVersion: '2023-01-01' })
}
```

## Configuration Options

### Environment Variables

```bash
# Required
SANITY_STUDIO_SITE_URL=https://yourdomain.com
SANITY_STUDIO_PROJECT_ID=your-project-id
SANITY_STUDIO_DATASET=production

# Optional
SANITY_STUDIO_RENEWALS_ENABLED=true
SANITY_STUDIO_DEFAULT_CURRENCY=USD
```

### Customization

```javascript
// Custom styling
const customRenewals = Renewals({
  theme: {
    primaryColor: '#your-color',
    borderRadius: '8px'
  },
  features: {
    discountCodes: true,
    additionalItems: true,
    orderSearch: true
  }
})
```

## Requirements

- Sanity Studio v3+
- React 18+
- Sanity UI v1+
- Node.js 16+

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Security Considerations

- Cart URLs are validated before processing
- Order data is fetched securely through Sanity client
- Discount codes require proper permissions
- Customer data is handled according to privacy regulations

## Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests for improvements.

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing issues for solutions
- Review the documentation

## Changelog

### v1.0.0
- Initial release
- Cart lookup and validation
- Interactive renewal forms
- Dynamic pricing calculations
- Order summary sidebar
- Smart search functionality
- Discount code integration
- Additional line items support