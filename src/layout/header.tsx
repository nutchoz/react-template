
export default function Header({headerName}: {headerName: string}) {
    return (
        <header className="flex w-[100%] h-20 bg-gradient-to-r from-orange-700 to-orange-500 border-b-8 border-blue-900 shadow-md items-center px-6 justify-between">
            <div className="text-3xl text-gray-50 font-bold">{headerName}</div>
        </header>
    )
}
