import { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import RequestHandler from '../lib/utilities/RequestHandler';

interface GridCell {
    row: number;
    col: number;
    height: number;
}

interface Section {
    id: number;
    name: string;
    row: number;
    col: number;
    gridData: GridCell[][];
}

const SECTIONS_DATA: Section[] = [
    {
        id: 1,
        name: 'XA',
        row: 10,
        col: 9,
        gridData: Array.from({ length: 10 }, (_, i) =>
            Array.from({ length: 9 }, (_, j) => ({
                row: i,
                col: j,
                height: 0
            }))
        )
    },
    {
        id: 2,
        name: 'XB',
        row: 10,
        col: 9,
        gridData: Array.from({ length: 10 }, (_, i) =>
            Array.from({ length: 9 }, (_, j) => ({
                row: i,
                col: j,
                height: 0
            }))
        )
    },
    {
        id: 3,
        name: 'XC',
        row: 10,
        col: 9,
        gridData: Array.from({ length: 10 }, (_, i) =>
            Array.from({ length: 9 }, (_, j) => ({
                row: i,
                col: j,
                height: 0
            }))
        )
    },
    {
        id: 4,
        name: 'XD',
        row: 10,
        col: 6,
        gridData: Array.from({ length: 10 }, (_, i) =>
            Array.from({ length: 6 }, (_, j) => ({
                row: i,
                col: j,
                height: 0
            }))
        )
    },
    {
        id: 5,
        name: 'XE',
        row: 10,
        col: 6,
        gridData: Array.from({ length: 10 }, (_, i) =>
            Array.from({ length: 6 }, (_, j) => ({
                row: i,
                col: j,
                height: 0
            }))
        )
    },
    {
        id: 6,
        name: 'XF',
        row: 10,
        col: 6,
        gridData: Array.from({ length: 10 }, (_, i) =>
            Array.from({ length: 6 }, (_, j) => ({
                row: i,
                col: j,
                height: 0
            }))
        )
    },
    {
        id: 7,
        name: 'XG',
        row: 10,
        col: 6,
        gridData: Array.from({ length: 10 }, (_, i) =>
            Array.from({ length: 6 }, (_, j) => ({
                row: i,
                col: j,
                height: 0
            }))
        )
    },
    {
        id: 8,
        name: 'XH',
        row: 8,
        col: 5,
        gridData: Array.from({ length: 8 }, (_, i) =>
            Array.from({ length: 5 }, (_, j) => ({
                row: i,
                col: j,
                height: 0
            }))
        )
    },
];

const CUBE_WIDTH = 1;
const CUBE_DEPTH = 1.5;
const SPACING = 0.1;

const heightColors = [
    '#95A5A6', // Height 0 – Gray (empty)
    '#3498DB', // Height 1 – Blue
    '#28B463', // Height 2 – Green
    '#F1C40F', // Height 3 – Yellow
    '#E74C3C'  // Height 4 – Red
];

interface CubeProps {
    row: number;
    col: number;
    cellHeight: number;
    offsetX: number;
    offsetZ: number;
    isHighlighted: boolean;
}

function Cube({ row, col, cellHeight, offsetX, offsetZ, isHighlighted }: CubeProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const displayHeight = cellHeight === 0 ? 0.5 : cellHeight;
    
    const x = row * (CUBE_WIDTH + SPACING) - offsetX;
    const z = col * (CUBE_DEPTH + SPACING) - offsetZ;
    const y = displayHeight / 2;

    return (
        <mesh
            ref={meshRef}
            position={[x, y, z]}
            userData={{ row, col, height: cellHeight }}
        >
            <boxGeometry args={[CUBE_WIDTH, displayHeight, CUBE_DEPTH]} />
            <meshStandardMaterial
                color={heightColors[cellHeight]}
                transparent
                opacity={isHighlighted ? 1 : (cellHeight === 0 ? 0.3 : 0.8)}
                emissive={isHighlighted ? '#ff3300' : '#000000'}
                emissiveIntensity={isHighlighted ? 0.5 : 0}
            />
        </mesh>
    );
}

interface GridSceneProps {
    sectionData: GridCell[][];
    rowCount: number;
    colCount: number;
    highlightedRow: number | null;
    highlightedCol: number | null;
}

function GridScene({ sectionData, rowCount, colCount, highlightedRow, highlightedCol }: GridSceneProps) {
    const offsetX = (rowCount * (CUBE_WIDTH + SPACING)) / 2 - (CUBE_WIDTH + SPACING) / 2;
    const offsetZ = (colCount * (CUBE_DEPTH + SPACING)) / 2 - (CUBE_DEPTH + SPACING) / 2;

    return (
        <>
            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 10, 10]} intensity={0.8} />

            {/* Grid Helper */}
            <gridHelper args={[15, 12, 0x999999, 0xdddddd]} position={[0, 0, 0]} />

            {Array.from({ length: rowCount }).map((_, i) => {
                const x = i * (CUBE_WIDTH + SPACING) - offsetX;
                return (
                    <Text
                        key={`row-${i}`}
                        position={[x, 0.1, -8]}
                        fontSize={0.5}
                        color="#333333"
                        anchorX="center"
                        anchorY="middle"
                    >
                        R{i}
                    </Text>
                );
            })}

            {/* Column Labels */}
            {Array.from({ length: colCount }).map((_, j) => {
                const z = j * (CUBE_DEPTH + SPACING) - offsetZ;
                return (
                    <Text
                        key={`col-${j}`}
                        position={[-8, 0.1, z]}
                        fontSize={0.5}
                        color="#333333"
                        anchorX="center"
                        anchorY="middle"
                    >
                        C{j}
                    </Text>
                );
            })}

            {/* Grid Cubes */}
            {sectionData.map((row, i) =>
                row.map((cell, j) => (
                    <Cube
                        key={`${i}-${j}`}
                        row={i}
                        col={j}
                        cellHeight={cell.height}
                        offsetX={offsetX}
                        offsetZ={offsetZ}
                        isHighlighted={highlightedRow === i && highlightedCol === j}
                    />
                ))
            )}
        </>
    );
}

export default function GridHighlighter() {
    const [_, setIsLoading] = useState<boolean>(false);
    const [, setRecordsLocation] = useState<any[]>([]);
    const [row, setRow] = useState<string>('');
    const [col, setCol] = useState<string>('');
    const [currentSection, setCurrentSection] = useState<number>(0);
    const [highlightedRow, setHighlightedRow] = useState<number | null>(null);
    const [highlightedCol, setHighlightedCol] = useState<number | null>(null);

    useEffect(() => {
        fetchRecords();
    }, []);

    const updateSectionsWithRecords = (records: any[]) => {
        records.forEach(record => {
            const location = record.location;
            const parts = location.split('-');
            if (parts.length === 4) {
                const sectionName = parts[0];
                const row = parseInt(parts[1]);
                const col = parseInt(parts[2]);
                const height = parseInt(parts[3]);

                const sectionIndex = SECTIONS_DATA.findIndex(s => s.name === sectionName);
                if (sectionIndex !== -1) {
                    const section = SECTIONS_DATA[sectionIndex];
                    if (row >= 0 && row < section.row && col >= 0 && col < section.col) {
                        section.gridData[row][col].height = height;
                    }
                }
            }
        });
    };

    const fetchRecords = async () => {
        setIsLoading(true);
        try {
            const response = await RequestHandler.fetchData('GET', 'gate-entry/get-all-location');
            if (response && !response.success === false) {
                const records = Array.isArray(response.data) ? response.data : [];
                setRecordsLocation(records);
                updateSectionsWithRecords(records);
            }
        } catch (error) {
            console.error('Error fetching records location:', error);
            alert('Failed to fetch records. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleHighlight = () => {
        const currentSectionData = SECTIONS_DATA[currentSection];
        const rowNum = parseInt(row);
        const colNum = parseInt(col);

        if (isNaN(rowNum) || isNaN(colNum) || rowNum < 0 || rowNum >= currentSectionData.row || colNum < 0 || colNum >= currentSectionData.col) {
            alert(`Please enter valid row (0-${currentSectionData.row - 1}) and column (0-${currentSectionData.col - 1}) numbers`);
            return;
        }
        setHighlightedRow(rowNum);
        setHighlightedCol(colNum);
    };

    const handleReset = () => {
        setHighlightedRow(null);
        setHighlightedCol(null);
        setRow('');
        setCol('');
    };

    const currentSectionData = SECTIONS_DATA[currentSection];
    return (
        <div className="flex flex-1 h-[90vh] bg-gradient-to-br from-gray-100 to-gray-200">
            <div
                className="flex-1 mt-5 max-h-[85vh] bg-white shadow-inner"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(200, 200, 200, 0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(200, 200, 200, 0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                }}
            >
                <Canvas
                    camera={{ position: [8, 8, 8], fov: 75 }}
                    gl={{ antialias: true, alpha: true }}
                >
                    <GridScene
                        sectionData={currentSectionData.gridData}
                        rowCount={currentSectionData.row}
                        colCount={currentSectionData.col}
                        highlightedRow={highlightedRow}
                        highlightedCol={highlightedCol}
                    />
                    <OrbitControls
                        enablePan={false}
                        minDistance={5}
                        maxDistance={30}
                        maxPolarAngle={Math.PI - 0.1}
                        minPolarAngle={0.1}
                    />
                </Canvas>
            </div>

            <div className="w-[25%] bg-white shadow-2xl p-8 overflow-y-auto">
                <h2 className="text-3xl font-bold text-gray-800 mb-8 border-b-4 border-orange-500 pb-3">
                    Container Grid
                </h2>

                <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                        Section
                    </label>
                    <div className="flex gap-3 flex-wrap">
                        {SECTIONS_DATA.map((section, index) => (
                            <button
                                key={section.id}
                                onClick={() => {
                                    setCurrentSection(index);
                                    handleReset();
                                }}
                                className={`flex-1 min-w-[60px] py-3 rounded-xl font-semibold transition-all duration-300 shadow-md ${currentSection === index
                                    ? 'bg-orange-500 text-white shadow-orange-300 scale-105'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-lg'
                                    }`}
                            >
                                {section.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                            Row (0-{currentSectionData.row - 1})
                        </label>
                        <input
                            type="number"
                            min="0"
                            max={currentSectionData.row - 1}
                            value={row}
                            onChange={(e) => setRow(e.target.value)}
                            className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all text-lg"
                            placeholder="Enter row"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                            Column (0-{currentSectionData.col - 1})
                        </label>
                        <input
                            type="number"
                            min="0"
                            max={currentSectionData.col - 1}
                            value={col}
                            onChange={(e) => setCol(e.target.value)}
                            className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all text-lg"
                            placeholder="Enter column"
                        />
                    </div>

                    <button
                        onClick={handleHighlight}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        Highlight Container
                    </button>

                    <button
                        onClick={handleReset}
                        className="w-full bg-gray-200 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-300 transition-all shadow-md hover:shadow-lg"
                    >
                        Reset View
                    </button>
                </div>

                <div className="mt-10 p-5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-l-4 border-orange-500">
                    <h3 className="font-bold text-gray-800 mb-3 text-lg">🎮 Controls</h3>
                    <ul className="text-sm text-gray-700 space-y-2">
                        <li className="flex items-start">
                            <span className="text-orange-500 mr-2">•</span>
                            <span><strong>Drag:</strong> Rotate camera</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-orange-500 mr-2">•</span>
                            <span><strong>Scroll:</strong> Zoom in/out</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-orange-500 mr-2">•</span>
                            <span><strong>Input:</strong> Row/col to highlight</span>
                        </li>
                    </ul>
                </div>

                <div className="mt-6 p-5 bg-gray-50 rounded-xl">
                    <h3 className="font-bold text-gray-800 mb-3 text-lg">Height Legend</h3>

                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-6 h-6 rounded"
                                style={{ backgroundColor: '#95A5A6' }}
                            ></div>
                            <span className="text-sm text-gray-700">Height 0 (Empty)</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div
                                className="w-6 h-6 rounded"
                                style={{ backgroundColor: '#3498DB' }}
                            ></div>
                            <span className="text-sm text-gray-700">Height 1</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div
                                className="w-6 h-6 rounded"
                                style={{ backgroundColor: '#28B463' }}
                            ></div>
                            <span className="text-sm text-gray-700">Height 2</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div
                                className="w-6 h-6 rounded"
                                style={{ backgroundColor: '#F1C40F' }}
                            ></div>
                            <span className="text-sm text-gray-700">Height 3</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div
                                className="w-6 h-6 rounded"
                                style={{ backgroundColor: '#E74C3C' }}
                            ></div>
                            <span className="text-sm text-gray-700">Height 4</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}