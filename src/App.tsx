import { Routes, Route, useLocation } from "react-router-dom";
import Dashboard from "./routes/dashboard";// import Header from "./layout/header";
import Navbar from "./layout/nav";
import Header from "./layout/header";
import GridHighlighter from "./routes/container";
import GateEntryManagement from "./routes/gate_entry";

export default function App() {
	const location = useLocation();
	const getLocation = () => {
		switch (location.pathname) {
			case "/":
				return "Dashboard";
			case "/gate":
				return "Gate Entry";
			default:
				return "Dashboard";
		}
	}
	return (
		<>
			<div className="flex w-[100vw] h-[100vh] bg-gray-200">
				<Navbar />
				<div className="flex flex-col flex-1">
					<Header headerName={getLocation()}/>
					<Routes>
						<Route path="/" element={<Dashboard />} />
						<Route path="/gate" element={<GateEntryManagement />} />
						<Route path="/container" element={<GridHighlighter />} />
					</Routes>
				</div>
			</div>
		</>
	);
}
