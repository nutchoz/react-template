import { useRef, useEffect, useState } from 'react';
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

export default function GridHighlighter() {
    const mountRef = useRef<HTMLDivElement>(null);
    const [_, setIsLoading] = useState<boolean>(false);
    const [recordsLocation, setRecordsLocation] = useState<any[]>([]);
    const [row, setRow] = useState<string>('');
    const [col, setCol] = useState<string>('');
    const [currentSection, setCurrentSection] = useState<number>(0);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const cubesRef = useRef<THREE.Mesh[][]>([]);

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

    useEffect(() => {
        if (!mountRef.current) return;

        const sectionData = SECTIONS_DATA[currentSection].gridData;
        const rowCount = SECTIONS_DATA[currentSection].row;
        const colCount = SECTIONS_DATA[currentSection].col;

        const CUBE_WIDTH = 1;
        const CUBE_DEPTH = 1.5;
        const SPACING = 0.1;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(
            75,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.set(8, 8, 8);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setClearColor(0x000000, 0);
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        scene.add(directionalLight);

        const gridHelper = new THREE.GridHelper(15, 12, 0x999999, 0xdddddd);
        gridHelper.position.y = 0;
        scene.add(gridHelper);

        const createTextLabel = (text: string, position: THREE.Vector3, rotation?: THREE.Euler) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) return;

            canvas.width = 256;
            canvas.height = 128;
            context.fillStyle = '#333333';
            context.font = 'bold 60px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(text, 128, 64);

            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(material);
            sprite.position.copy(position);
            sprite.scale.set(2, 1, 1);
            if (rotation) sprite.rotation.copy(rotation);
            scene.add(sprite);
        };

        // Row labels
        for (let i = 0; i < rowCount; i++) {
            const offsetX = (rowCount * (CUBE_WIDTH + SPACING)) / 2 - (CUBE_WIDTH + SPACING) / 2;
            const x = i * (CUBE_WIDTH + SPACING) - offsetX;
            createTextLabel(`R${i}`, new THREE.Vector3(x, 0.1, -8));
        }

        // Column labels
        for (let j = 0; j < colCount; j++) {
            const offsetZ = (colCount * (CUBE_DEPTH + SPACING)) / 2 - (CUBE_DEPTH + SPACING) / 2;
            const z = j * (CUBE_DEPTH + SPACING) - offsetZ;
            createTextLabel(`C${j}`, new THREE.Vector3(-8, 0.1, z));
        }

        cubesRef.current = [];
        createGrid();

        function createGrid() {
            cubesRef.current.forEach((rowCubes: THREE.Mesh[]) => {
                rowCubes.forEach((cube: THREE.Mesh) => {
                    scene.remove(cube);
                    cube.geometry.dispose();
                    (cube.material as THREE.Material).dispose();
                });
            });

            const cubes: THREE.Mesh[][] = [];
            const offsetX = (rowCount * (CUBE_WIDTH + SPACING)) / 2 - (CUBE_WIDTH + SPACING) / 2;
            const offsetZ = (colCount * (CUBE_DEPTH + SPACING)) / 2 - (CUBE_DEPTH + SPACING) / 2;

            const heightColors = [
                0x95A5A6, // Height 0 – Gray (empty)
                0x3498DB, // Height 1 – Blue
                0x28B463, // Height 2 – Green
                0xF1C40F, // Height 3 – Yellow
                0xE74C3C  // Height 4 – Red
            ];

            for (let i = 0; i < rowCount; i++) {
                cubes[i] = [];
                for (let j = 0; j < colCount; j++) {
                    const cellHeight = sectionData[i][j].height;
                    // Use minimum height of 0.5 for visual consistency, or actual height
                    const displayHeight = cellHeight === 0 ? 0.5 : cellHeight;
                    const geometry = new THREE.BoxGeometry(CUBE_WIDTH, displayHeight, CUBE_DEPTH);
                    const material = new THREE.MeshStandardMaterial({
                        color: heightColors[cellHeight],
                        transparent: true,
                        opacity: cellHeight === 0 ? 0.3 : 0.8,
                    });
                    const cube = new THREE.Mesh(geometry, material);

                    cube.position.x = i * (CUBE_WIDTH + SPACING) - offsetX;
                    cube.position.z = j * (CUBE_DEPTH + SPACING) - offsetZ;
                    cube.position.y = displayHeight / 2;

                    cube.userData = { row: i, col: j, height: cellHeight };

                    scene.add(cube);
                    cubes[i][j] = cube;
                }
            }
            cubesRef.current = cubes;
        }

        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        let cameraAngle = { theta: Math.PI / 4, phi: Math.PI / 4 };
        const cameraDistance = 15;

        const updateCameraPosition = () => {
            camera.position.x = cameraDistance * Math.sin(cameraAngle.theta) * Math.cos(cameraAngle.phi);
            camera.position.y = cameraDistance * Math.sin(cameraAngle.phi);
            camera.position.z = cameraDistance * Math.cos(cameraAngle.theta) * Math.cos(cameraAngle.phi);
            camera.lookAt(0, 0, 0);
        };

        const onMouseDown = (e: MouseEvent) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        };

        const onMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const deltaX = e.clientX - previousMousePosition.x;
                const deltaY = e.clientY - previousMousePosition.y;

                cameraAngle.theta += deltaX * 0.01;
                cameraAngle.phi += deltaY * 0.01;

                cameraAngle.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraAngle.phi));

                updateCameraPosition();

                previousMousePosition = { x: e.clientX, y: e.clientY };
            }
        };

        const onMouseUp = () => {
            isDragging = false;
        };

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const zoomSpeed = 0.1;
            const newDistance = cameraDistance + e.deltaY * zoomSpeed * 0.01;
            const clampedDistance = Math.max(5, Math.min(30, newDistance));

            camera.position.multiplyScalar(clampedDistance / camera.position.length());
            camera.lookAt(0, 0, 0);
        };

        renderer.domElement.addEventListener('mousedown', onMouseDown);
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('mouseup', onMouseUp);
        renderer.domElement.addEventListener('wheel', onWheel);

        const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            if (!mountRef.current) return;
            camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            renderer.domElement.removeEventListener('mousedown', onMouseDown);
            renderer.domElement.removeEventListener('mousemove', onMouseMove);
            renderer.domElement.removeEventListener('mouseup', onMouseUp);
            renderer.domElement.removeEventListener('wheel', onWheel);
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [currentSection, recordsLocation]);

    const handleHighlight = () => {
        const currentSectionData = SECTIONS_DATA[currentSection];
        const rowNum = parseInt(row);
        const colNum = parseInt(col);

        if (isNaN(rowNum) || isNaN(colNum) || rowNum < 0 || rowNum >= currentSectionData.row || colNum < 0 || colNum >= currentSectionData.col) {
            alert(`Please enter valid row (0-${currentSectionData.row - 1}) and column (0-${currentSectionData.col - 1}) numbers`);
            return;
        }

        cubesRef.current.forEach((rowCubes: THREE.Mesh[]) => {
            rowCubes.forEach((cube: THREE.Mesh) => {
                const material = cube.material as THREE.MeshStandardMaterial;
                if (cube.userData.row === rowNum && cube.userData.col === colNum) {
                    material.opacity = 1;
                    material.emissive = new THREE.Color(0xff3300);
                    material.emissiveIntensity = 0.5;
                } else {
                    material.opacity = 0.2;
                    material.emissive = new THREE.Color(0x000000);
                    material.emissiveIntensity = 0;
                }
            });
        });
    };

    const handleReset = () => {
        cubesRef.current.forEach((rowCubes: THREE.Mesh[]) => {
            rowCubes.forEach((cube: THREE.Mesh) => {
                const material = cube.material as THREE.MeshStandardMaterial;
                const cellHeight = cube.userData.height;
                material.opacity = cellHeight === 0 ? 0.3 : 0.8;
                material.emissive = new THREE.Color(0x000000);
                material.emissiveIntensity = 0;
            });
        });
        setRow('');
        setCol('');
    };

    const currentSectionData = SECTIONS_DATA[currentSection];

    return (
        <div className="flex flex-1 h-[90vh] bg-gradient-to-br from-gray-100 to-gray-200">
            <div
                ref={mountRef}
                className="flex-1 mt-5 max-h-[85vh] bg-white shadow-inner"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(200, 200, 200, 0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(200, 200, 200, 0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                }}
            />

            <div className="w-[25%] bg-white shadow-2xl p-8 overflow-y-auto">
                <h2 className="text-3xl font-bold text-gray-800 mb-8 border-b-4 border-orange-500 pb-3">
                    Container Grid
                </h2>

                <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                        Section
                    </label>
                    <div className="flex gap-3">
                        {SECTIONS_DATA.map((section, index) => (
                            <button
                                key={section.id}
                                onClick={() => {
                                    setCurrentSection(index);
                                    handleReset();
                                }}
                                className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md ${currentSection === index
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