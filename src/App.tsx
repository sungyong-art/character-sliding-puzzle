import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, RotateCcw, Image as ImageIcon, Timer, Hash, RefreshCw, Trophy } from 'lucide-react';

type GridSize = 3 | 4 | 5;

interface PuzzleState {
  tiles: number[];
  emptyIndex: number;
  moves: number;
  seconds: number;
  isStarted: boolean;
  isSolved: boolean;
}

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState<GridSize>(3);
  const [puzzle, setPuzzle] = useState<PuzzleState>({
    tiles: [],
    emptyIndex: -1,
    moves: 0,
    seconds: 0,
    isStarted: false,
    isSolved: false,
  });
  const [showHint, setShowHint] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and Shuffle Puzzle
  const initPuzzle = useCallback((size: GridSize) => {
    const totalTiles = size * size;
    const initialTiles = Array.from({ length: totalTiles }, (_, i) => i);

    // Shuffle logic (Fisher-Yates)
    const shuffle = (array: number[]) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    // Ensure solvability for sliding puzzle
    const isSolvable = (tiles: number[], size: GridSize) => {
      let inversions = 0;
      const flatTiles = tiles.filter(t => t !== totalTiles - 1);
      for (let i = 0; i < flatTiles.length; i++) {
        for (let j = i + 1; j < flatTiles.length; j++) {
          if (flatTiles[i] > flatTiles[j]) inversions++;
        }
      }

      if (size % 2 !== 0) {
        return inversions % 2 === 0;
      } else {
        const emptyRowFromBottom = size - Math.floor(tiles.indexOf(totalTiles - 1) / size);
        return (emptyRowFromBottom % 2 === 0) ? (inversions % 2 !== 0) : (inversions % 2 === 0);
      }
    };

    let shuffledTiles;
    do {
      shuffledTiles = shuffle(initialTiles);
    } while (!isSolvable(shuffledTiles, size) || JSON.stringify(shuffledTiles) === JSON.stringify(initialTiles));

    setPuzzle({
      tiles: shuffledTiles,
      emptyIndex: shuffledTiles.indexOf(totalTiles - 1),
      moves: 0,
      seconds: 0,
      isStarted: true,
      isSolved: false,
    });

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setPuzzle(prev => ({ ...prev, seconds: prev.seconds + 1 }));
    }, 1000);
  }, []);

  const handleTileClick = (index: number) => {
    if (!puzzle.isStarted || puzzle.isSolved) return;

    const size = gridSize;
    const emptyIdx = puzzle.emptyIndex;

    const row = Math.floor(index / size);
    const col = index % size;
    const emptyRow = Math.floor(emptyIdx / size);
    const emptyCol = emptyIdx % size;

    const isAdjacent =
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow);

    if (isAdjacent) {
      const newTiles = [...puzzle.tiles];
      [newTiles[index], newTiles[emptyIdx]] = [newTiles[emptyIdx], newTiles[index]];

      const solved = newTiles.every((tile, i) => tile === i);

      if (solved) {
        if (timerRef.current) clearInterval(timerRef.current);
      }

      setPuzzle(prev => ({
        ...prev,
        tiles: newTiles,
        emptyIndex: index,
        moves: prev.moves + 1,
        isSolved: solved
      }));
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setPuzzle(prev => ({ ...prev, isStarted: false, isSolved: false }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  });

  const resetGame = () => {
    if (image) initPuzzle(gridSize);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-4 md:p-8 flex flex-col items-center font-sans">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
          PUZZLE MASTER
        </h1>
        <p className="text-neutral-400">당신의 이미지를 조각내어 퍼즐로 즐겨보세요!</p>
      </header>

      <main className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 items-start justify-center">
        {/* Left Side: Controls and Image Upload */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          {!image ? (
            <div
              {...getRootProps()}
              className={`border-4 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 h-64
                ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-neutral-700 hover:border-neutral-500 bg-neutral-800'}`}
            >
              <input {...getInputProps()} />
              <div className="p-4 bg-neutral-700 rounded-full">
                <Upload className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-lg">이미지를 드래그하세요</p>
                <p className="text-sm text-neutral-500 mt-1">또는 클릭하여 파일 선택</p>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-800 p-6 rounded-3xl border border-neutral-700 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-neutral-400 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> 난이도 설정
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 4, 5].map((size) => (
                    <button
                      key={size}
                      onClick={() => setGridSize(size as GridSize)}
                      className={`py-2 rounded-xl font-bold transition-all ${gridSize === size
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                          : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                        }`}
                    >
                      {size}x{size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={resetGame}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/10 active:scale-95"
                >
                  <RotateCcw className="w-5 h-5" /> {puzzle.isStarted ? '다시 시작' : '게임 시작'}
                </button>

                <div
                  className="relative group w-full"
                  onMouseEnter={() => setShowHint(true)}
                  onMouseLeave={() => setShowHint(false)}
                >
                  <div className="w-full py-3 bg-neutral-700 border border-neutral-600 rounded-2xl font-bold text-center cursor-help flex items-center justify-center gap-2">
                    <ImageIcon className="w-4 h-4" /> 원본 보기 (Hover)
                  </div>
                  {showHint && (
                    <div className="absolute bottom-full left-0 mb-4 w-full aspect-square bg-neutral-800 border-2 border-blue-500 p-2 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in duration-200">
                      <img src={image} alt="Hint" className="w-full h-full object-cover rounded-xl" />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setImage(null)}
                  className="w-full py-3 text-neutral-500 hover:text-white transition-colors text-sm font-medium"
                >
                  다른 이미지 업로드
                </button>
              </div>
            </div>
          )}

          {/* Stats Display */}
          {puzzle.isStarted && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-800/50 p-4 rounded-2xl border border-neutral-700 flex flex-col items-center gap-1">
                <div className="text-neutral-500 flex items-center gap-1 text-xs">
                  <Hash className="w-3 h-3" /> MOVES
                </div>
                <div className="text-2xl font-black">{puzzle.moves}</div>
              </div>
              <div className="bg-neutral-800/50 p-4 rounded-2xl border border-neutral-700 flex flex-col items-center gap-1">
                <div className="text-neutral-500 flex items-center gap-1 text-xs">
                  <Timer className="w-3 h-3" /> TIME
                </div>
                <div className="text-2xl font-black">
                  {Math.floor(puzzle.seconds / 60)}:{(puzzle.seconds % 60).toString().padStart(2, '0')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Puzzle Board */}
        <div className="w-full lg:w-2/3 flex flex-col items-center">
          <div
            className="relative bg-neutral-800 p-3 rounded-[2rem] border-4 border-neutral-700 shadow-2xl"
            style={{ width: 'min(90vw, 500px)', height: 'min(90vw, 500px)' }}
          >
            {!image ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 gap-4">
                <div className="w-24 h-24 border-4 border-neutral-700 rounded-3xl flex items-center justify-center">
                  <ImageIcon className="w-12 h-12" />
                </div>
                <p className="font-bold">퍼즐판이 비어있습니다</p>
              </div>
            ) : !puzzle.isStarted ? (
              <div className="w-full h-full relative group">
                <img src={image} alt="Ready" className="w-full h-full object-cover rounded-2xl opacity-40 blur-sm" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <p className="text-2xl font-black uppercase tracking-widest text-white/50">Ready to Play?</p>
                </div>
              </div>
            ) : (
              <div
                className="grid gap-1 w-full h-full"
                style={{
                  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                  gridTemplateRows: `repeat(${gridSize}, 1fr)`
                }}
              >
                {puzzle.tiles.map((tileValue, index) => {
                  const isEmpty = tileValue === gridSize * gridSize - 1;
                  const row = Math.floor(tileValue / gridSize);
                  const col = tileValue % gridSize;

                  return (
                    <button
                      key={index}
                      onClick={() => handleTileClick(index)}
                      disabled={puzzle.isSolved}
                      className={`relative w-full h-full rounded-lg overflow-hidden transition-all duration-200 active:scale-95 shadow-lg
                        ${isEmpty ? 'bg-transparent invisible' : 'bg-neutral-700 border border-white/10'}`}
                    >
                      {!isEmpty && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            backgroundImage: `url(${image})`,
                            backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                            backgroundPosition: `${(col / (gridSize - 1)) * 100}% ${(row / (gridSize - 1)) * 100}%`
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Win Overlay */}
            {puzzle.isSolved && (
              <div className="absolute inset-0 bg-blue-600/90 flex flex-col items-center justify-center gap-6 rounded-[1.8rem] z-10 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
                  <Trophy className="w-12 h-12 text-blue-600" />
                </div>
                <div className="text-center">
                  <h2 className="text-4xl font-black text-white mb-2">SOLVED!</h2>
                  <p className="text-blue-100 italic">Excellent work, champion.</p>
                </div>
                <div className="flex gap-4">
                  <div className="bg-white/20 px-6 py-2 rounded-full font-bold text-white pr-4">
                    {puzzle.moves} Moves
                  </div>
                  <div className="bg-white/20 px-6 py-2 rounded-full font-bold text-white">
                    {Math.floor(puzzle.seconds / 60)}:{(puzzle.seconds % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                <button
                  onClick={resetGame}
                  className="mt-4 bg-white text-blue-600 px-8 py-4 rounded-2xl font-black hover:bg-neutral-100 transition-colors shadow-xl"
                >
                  PLAY AGAIN
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-12 text-neutral-600 text-sm">
        Drag and Drop an image to create your custom puzzle.
      </footer>
    </div>
  );
};

export default App;
