// Sanity Renewals Authorization Tool
// Comprehensive renewal order management system for subscription-based businesses

export { default as RenewalsAuthorizationComponent } from './RenewalsAuthorizationComponent';

// Main tool export for Sanity Studio
export const RenewalsAuthorization = () => ({
	name: 'renewals',
	title: 'Renewals',
	icon: () => '🔄',
	component: RenewalsAuthorizationComponent,
});

// Named export alias
export const Renewals = RenewalsAuthorization;
