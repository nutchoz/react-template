import { LayoutDashboard, TestTube } from 'lucide-react';

export default function Navbar() {

	const navStyle = {
		base: "flex items-center gap-3 px-6 py-3 text-lg font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-lg transition-all duration-300",
		hover: "hover:border-orange-500 hover:bg-gradient-to-r from-orange-800 to-orange-500 hover:text-white hover:shadow-lg hover:translate-x-1"
	};
	return (
		<nav className="min-w-75 w-75 h-screen bg-gray-50 shadow-2xl">
			<div className="p-6">
				<img src="/logo.jpg" alt="Logo" className="w-full rounded-lg" />
			</div>
			
			<ul className="flex flex-col px-4 mt-8 space-y-2">
				<li>
					<a 
						href="/" 
						className={`${navStyle.base} ${navStyle.hover}`}
					>
						<LayoutDashboard size={20} />
						Dashboard
					</a>
				</li>
				<li>
					<a 
						href="/gate" 
						className={`${navStyle.base} ${navStyle.hover}`}
					>
						<TestTube size={20} />
						Gate Entry
					</a>
				</li>
				<li>
					<a 
						href="/container" 
						className={`${navStyle.base} ${navStyle.hover}`}
					>
						<TestTube size={20} />
						Container Grid
					</a>
				</li>
			</ul>
		</nav>
	);
}