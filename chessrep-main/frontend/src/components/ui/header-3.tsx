'use client';

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from './button';
import { cn } from '../../lib/utils';
import { MenuToggleIcon } from './menu-toggle-icon';
import { createPortal } from 'react-dom';
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuList,
	NavigationMenuTrigger,
} from './navigation-menu';
import { LucideIcon } from 'lucide-react';
import {
	CodeIcon,
	GlobeIcon,
	LayersIcon,
	UserPlusIcon,
	Users,
	Star,
	FileText,
	Shield,
	RotateCcw,
	Handshake,
	Leaf,
	HelpCircle,
	BarChart,
	PlugIcon,
	Target,
	BookOpen,
	Trophy,
	Brain,
	Clock,
	Zap,
	Eye,
	RefreshCw,
	Settings,
	Mail,
	DollarSign,
	Info,
	LayoutDashboard,
} from 'lucide-react';
import ChessStriveLogo from '../ChessTriveLogo';

type LinkItem = {
	title: string;
	href: string;
	icon: LucideIcon;
	description?: string;
};

export function Header() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [open, setOpen] = React.useState(false);
	const scrolled = useScroll(10);

	React.useEffect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [open]);

	const handleSignIn = () => {
		navigate('/login');
		setOpen(false);
	};

	const handleGetStarted = () => {
		navigate('/signup');
		setOpen(false);
	};

	const handleLogout = () => {
		logout();
		navigate('/');
		setOpen(false);
	};

	return (
		<header
			className={cn('sticky top-0 z-50 w-full border-b border-transparent', {
				'bg-background/95 supports-[backdrop-filter]:bg-background/50 border-border backdrop-blur-lg':
					scrolled,
			})}
		>
			<nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
				<div className="flex items-center gap-5">
					<Link to="/" className="hover:bg-accent rounded-md p-2">
						<ChessStriveLogo size={32} showText={false} />
					</Link>
					<div className="hidden md:flex items-center space-x-1">
						<NavigationMenu>
							<NavigationMenuList>
								<NavigationMenuItem className="relative group">
									<NavigationMenuTrigger className="bg-transparent">Product</NavigationMenuTrigger>
									<div className="absolute top-full left-0 mt-1 w-[600px] bg-popover border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
										<div className="p-4">
											<div className="grid grid-cols-2 gap-4">
												{productLinks.map((item, i) => (
													<ListItem key={i} {...item} />
												))}
											</div>
											<div className="mt-4 pt-4 border-t">
												<p className="text-muted-foreground text-sm">
													Interested?{' '}
													<Link to="/pricing" className="text-foreground font-medium hover:underline">
														View Pricing
													</Link>
												</p>
											</div>
										</div>
									</div>
								</NavigationMenuItem>
								<NavigationMenuItem className="relative group">
									<NavigationMenuTrigger className="bg-transparent">Company</NavigationMenuTrigger>
									<div className="absolute top-full left-0 mt-1 w-[500px] bg-popover border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
										<div className="p-4">
											<div className="grid grid-cols-2 gap-4">
												<div className="space-y-2">
													{companyLinks.map((item, i) => (
														<ListItem key={i} {...item} />
													))}
												</div>
												<div className="space-y-2">
													{companyLinks2.map((item, i) => (
														<Link
															key={i}
															to={item.href}
															className="flex p-2 hover:bg-accent flex-row rounded-md items-center gap-x-2"
														>
															<item.icon className="text-foreground size-4" />
															<span className="font-medium">{item.title}</span>
														</Link>
													))}
												</div>
											</div>
										</div>
									</div>
								</NavigationMenuItem>
								<NavigationMenuItem>
									<Link to="/pricing" className="hover:bg-accent rounded-md p-2 px-4">
										Pricing
									</Link>
								</NavigationMenuItem>
							</NavigationMenuList>
						</NavigationMenu>
					</div>
				</div>
				<div className="hidden items-center gap-2 md:flex">
					{user ? (
						<>
							<Link to="/dashboard">
								<Button variant="outline">Dashboard</Button>
							</Link>
							<Link to="/profile">
								<Button variant="outline">Profile</Button>
							</Link>
							<Button variant="outline" onClick={handleLogout}>
								Logout
							</Button>
						</>
					) : (
						<>
							<Button variant="outline" onClick={handleSignIn}>Sign In</Button>
							<Button onClick={handleGetStarted}>Get Started</Button>
						</>
					)}
				</div>
				<Button
					size="icon"
					variant="outline"
					onClick={() => setOpen(!open)}
					className="md:hidden"
					aria-expanded={open}
					aria-controls="mobile-menu"
					aria-label="Toggle menu"
				>
					<MenuToggleIcon open={open} className="size-5" duration={300} />
				</Button>
			</nav>
			<MobileMenu open={open} className="flex flex-col justify-between gap-2 overflow-y-auto">
				<NavigationMenu className="max-w-full">
					<div className="flex w-full flex-col gap-y-2">
						<span className="text-sm">Product</span>
						{productLinks.map((link) => (
							<ListItem key={link.title} {...link} />
						))}
						<span className="text-sm">Company</span>
						{companyLinks.map((link) => (
							<ListItem key={link.title} {...link} />
						))}
						{companyLinks2.map((link) => (
							<ListItem key={link.title} {...link} />
						))}
					</div>
				</NavigationMenu>
				<div className="flex flex-col gap-2">
					{user ? (
						<>
							<Link to="/dashboard" onClick={() => setOpen(false)}>
								<Button variant="outline" className="w-full bg-transparent">
									Dashboard
								</Button>
							</Link>
							<Link to="/profile" onClick={() => setOpen(false)}>
								<Button variant="outline" className="w-full bg-transparent">
									Profile
								</Button>
							</Link>
							<Button variant="outline" className="w-full bg-transparent" onClick={handleLogout}>
								Logout
							</Button>
						</>
					) : (
						<>
							<Button variant="outline" className="w-full bg-transparent" onClick={handleSignIn}>
								Sign In
							</Button>
							<Button className="w-full" onClick={handleGetStarted}>
								Get Started
							</Button>
						</>
					)}
				</div>
			</MobileMenu>
		</header>
	);
}

type MobileMenuProps = React.ComponentProps<'div'> & {
	open: boolean;
};

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
	if (!open || typeof window === 'undefined') return null;

	return createPortal(
		<div
			id="mobile-menu"
			className={cn(
				'bg-background/95 supports-[backdrop-filter]:bg-background/50 backdrop-blur-lg',
				'fixed top-14 right-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden border-y md:hidden',
			)}
		>
			<div
				data-slot={open ? 'open' : 'closed'}
				className={cn(
					'data-[slot=open]:animate-in data-[slot=open]:zoom-in-97 ease-out',
					'size-full p-4',
					className,
				)}
				{...props}
			>
				{children}
			</div>
		</div>,
		document.body,
	);
}

function ListItem({
	title,
	description,
	icon: Icon,
	className,
	href,
	...props
}: React.ComponentProps<'a'> & LinkItem) {
	return (
		<Link
			to={href}
			className={cn('w-full flex flex-row gap-x-2 data-[active=true]:focus:bg-accent data-[active=true]:hover:bg-accent data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground rounded-sm p-2', className)}
			{...props}
		>
			<div className="bg-background/40 flex aspect-square size-12 items-center justify-center rounded-md border shadow-sm">
				<Icon className="text-foreground size-5" />
			</div>
			<div className="flex flex-col items-start justify-center">
				<span className="font-medium">{title}</span>
				{description && <span className="text-muted-foreground text-xs">{description}</span>}
			</div>
		</Link>
	);
}

const productLinks: LinkItem[] = [
	{
		title: 'Tactical Training',
		href: '/puzzles',
		description: 'Master chess tactics and combinations',
		icon: Target,
	},
	{
		title: 'Endgame Mastery',
		href: '/endgame-trainer',
		description: 'Learn essential endgame techniques',
		icon: Trophy,
	},
	{
		title: 'Opening Theory',
		href: '/openings',
		description: 'Build your opening repertoire',
		icon: BookOpen,
	},
	{
		title: 'Game Analysis',
		href: '/analyze',
		description: 'Analyze your games with advanced tools',
		icon: BarChart,
	},
	{
		title: 'Bot Training',
		href: '/play-with-bot',
		description: 'Practice against AI opponents',
		icon: Brain,
	},
	{
		title: 'Lessons',
		href: '/lessons',
		description: 'Structured learning paths',
		icon: LayersIcon,
	},
];

const companyLinks: LinkItem[] = [
	{
		title: 'About Us',
		href: '/about',
		description: 'Learn more about our story and team',
		icon: Users,
	},
	{
		title: 'Dashboard',
		href: '/dashboard',
		description: 'Access your training dashboard',
		icon: LayoutDashboard,
	},
	{
		title: 'Pricing',
		href: '/pricing',
		description: 'View our pricing plans',
		icon: DollarSign,
	},
];

const companyLinks2: LinkItem[] = [
	{
		title: 'Help Center',
		href: '/contact',
		icon: HelpCircle,
	},
	{
		title: 'Contact Us',
		href: '/contact',
		icon: Mail,
	},
	{
		title: 'Privacy Policy',
		href: '/about',
		icon: Shield,
	},
];

function useScroll(threshold: number) {
	const [scrolled, setScrolled] = React.useState(false);

	const onScroll = React.useCallback(() => {
		setScrolled(window.scrollY > threshold);
	}, [threshold]);

	React.useEffect(() => {
		window.addEventListener('scroll', onScroll);
		return () => window.removeEventListener('scroll', onScroll);
	}, [onScroll]);

	// also check on first load
	React.useEffect(() => {
		onScroll();
	}, [onScroll]);

	return scrolled;
}


