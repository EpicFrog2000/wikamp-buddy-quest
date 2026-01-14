import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Coins, Play } from "lucide-react";

interface CupGameProps {
  points: number;
  onPointsChange: (change: number) => void;
}

export const CupGame = ({ points, onPointsChange }: CupGameProps) => {
  const [gameState, setGameState] = useState<"betting" | "showing" | "shuffling" | "choosing" | "result">("betting");
  const [ballPosition, setBallPosition] = useState(1); // 0, 1, or 2 - logical position (which cup has the ball)
  const [cupPositions, setCupPositions] = useState([0, 1, 2]); // Maps visual position to logical cup
  const [bet, setBet] = useState(10);
  const [selectedCup, setSelectedCup] = useState<number | null>(null);
  const [won, setWon] = useState(false);
  const [cupsLifted, setCupsLifted] = useState(false);
  const [shuffleCount, setShuffleCount] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("cupGameHighScore");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [totalWon, setTotalWon] = useState(0);

  // Shuffle animation
  const shuffleCups = useCallback(() => {
    const shuffles = 5 + Math.floor(Math.random() * 5);
    let count = 0;
    
    const doShuffle = () => {
      if (count >= shuffles) {
        setGameState("choosing");
        return;
      }
      
      setCupPositions(prev => {
        const newPositions = [...prev];
        const i = Math.floor(Math.random() * 3);
        const j = Math.floor(Math.random() * 3);
        [newPositions[i], newPositions[j]] = [newPositions[j], newPositions[i]];
        return newPositions;
      });
      
      count++;
      setShuffleCount(count);
      setTimeout(doShuffle, 300);
    };
    
    setTimeout(doShuffle, 500);
  }, []);

  const startGame = () => {
    if (bet > points || bet < 1) return;
    
    // Deduct bet
    onPointsChange(-bet);
    
    // Reset state - ball is placed under a RANDOM cup
    const newBallPosition = Math.floor(Math.random() * 3);
    setBallPosition(newBallPosition);
    setCupPositions([0, 1, 2]);
    setSelectedCup(null);
    setWon(false);
    setCupsLifted(true); // Show ball first
    setShuffleCount(0);
    setGameState("showing");
    
    // Show ball for 2 seconds, then hide and shuffle
    setTimeout(() => {
      setCupsLifted(false);
      setGameState("shuffling");
      setTimeout(() => {
        shuffleCups();
      }, 500);
    }, 2000);
  };

  const selectCup = (cupIndex: number) => {
    if (gameState !== "choosing") return;
    
    setSelectedCup(cupIndex);
    setCupsLifted(true);
    setGameState("result");
    
    // Find which visual position has the ball
    const ballVisualPosition = cupPositions.indexOf(ballPosition);
    const playerWon = cupIndex === ballVisualPosition;
    
    setWon(playerWon);
    
    if (playerWon) {
      const winAmount = bet * 2;
      onPointsChange(winAmount);
      const newTotalWon = totalWon + bet;
      setTotalWon(newTotalWon);
      
      if (newTotalWon > highScore) {
        setHighScore(newTotalWon);
        localStorage.setItem("cupGameHighScore", newTotalWon.toString());
      }
    }
  };

  const resetGame = () => {
    setGameState("betting");
    setCupsLifted(false);
    setSelectedCup(null);
  };

  const getCupStyle = (visualIndex: number) => {
    const logicalIndex = cupPositions[visualIndex];
    const baseX = visualIndex * 120;
    const isSelected = selectedCup === visualIndex;
    const shouldLift = cupsLifted;
    
    return {
      transform: `translateX(${baseX}px) translateY(${shouldLift ? -60 : 0}px)`,
      transition: gameState === "shuffling" ? "transform 0.25s ease-in-out" : "transform 0.5s ease-out",
    };
  };

  const getBallStyle = () => {
    const ballVisualPosition = cupPositions.indexOf(ballPosition);
    const baseX = ballVisualPosition * 120 + 45;
    
    return {
      left: `${baseX}px`,
      opacity: cupsLifted ? 1 : 0,
      transition: "opacity 0.3s ease-out, left 0.25s ease-in-out",
    };
  };

  return (
    <Card className="p-6 bg-gradient-to-b from-card to-background border-2 border-primary/10 shadow-xl">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              🎩 Trzy Kubki
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Znajdź piłkę pod jednym z trzech kubków!
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground">Najlepszy: {highScore}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
              <Coins className="w-5 h-5 text-secondary-foreground" />
              <span className="font-bold text-secondary-foreground">Punkty: {points}</span>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="relative bg-gradient-to-b from-secondary/30 to-secondary/10 rounded-xl p-8 min-h-[300px] flex flex-col items-center justify-center">
          {/* Cups Container */}
          <div className="relative h-[150px] w-[360px]">
            {/* Ball */}
            <div
              className="absolute bottom-0 w-[30px] h-[30px] rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-lg"
              style={getBallStyle()}
            />
            
            {/* Cups */}
            {[0, 1, 2].map((visualIndex) => (
              <div
                key={visualIndex}
                className={`absolute bottom-0 cursor-pointer transition-all ${
                  gameState === "choosing" ? "hover:scale-105" : ""
                } ${selectedCup === visualIndex ? "ring-4 ring-primary rounded-t-full" : ""}`}
                style={getCupStyle(visualIndex)}
                onClick={() => selectCup(visualIndex)}
              >
                {/* Cup */}
                <div className="relative">
                  <svg width="100" height="120" viewBox="0 0 100 120">
                    {/* Cup body */}
                    <defs>
                      <linearGradient id={`cupGradient${visualIndex}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8B4513" />
                        <stop offset="50%" stopColor="#D2691E" />
                        <stop offset="100%" stopColor="#8B4513" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M20 0 L80 0 L90 110 Q50 120 10 110 Z"
                      fill={`url(#cupGradient${visualIndex})`}
                      stroke="#5D3A1A"
                      strokeWidth="2"
                    />
                    {/* Cup rim */}
                    <ellipse cx="50" cy="8" rx="35" ry="8" fill="#A0522D" stroke="#5D3A1A" strokeWidth="2" />
                    {/* Highlight */}
                    <path
                      d="M30 20 L35 100"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          {/* Game States */}
          {gameState === "betting" && (
            <div className="mt-8 space-y-4 text-center">
              <div className="flex items-center justify-center gap-4">
                <label className="text-foreground font-medium">Twój zakład:</label>
                <Input
                  type="number"
                  min={1}
                  max={points}
                  value={bet}
                  onChange={(e) => setBet(Math.max(1, Math.min(points, parseInt(e.target.value) || 1)))}
                  className="w-24 text-center font-bold"
                />
                <span className="text-muted-foreground">punktów</span>
              </div>
              <Button
                onClick={startGame}
                disabled={bet > points || points === 0}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                <Play className="w-5 h-5" />
                Zagraj!
              </Button>
              {points === 0 && (
                <p className="text-destructive text-sm">Nie masz punktów do obstawienia!</p>
              )}
            </div>
          )}

          {gameState === "showing" && (
            <div className="mt-8 text-center">
              <p className="text-xl font-bold text-foreground">
                Zapamiętaj gdzie jest piłka! 👀
              </p>
              <p className="text-muted-foreground">Za chwilę zacznę mieszać...</p>
            </div>
          )}

          {gameState === "shuffling" && (
            <div className="mt-8 text-center">
              <p className="text-xl font-bold text-foreground animate-pulse">
                Mieszam kubki... 🔄
              </p>
              <p className="text-muted-foreground">Ruch {shuffleCount}</p>
            </div>
          )}

          {gameState === "choosing" && (
            <div className="mt-8 text-center">
              <p className="text-xl font-bold text-foreground">
                Wybierz kubek! 👆
              </p>
              <p className="text-muted-foreground">Kliknij na kubek, pod którym myślisz że jest piłka</p>
            </div>
          )}

          {gameState === "result" && (
            <div className="mt-8 text-center space-y-4">
              {won ? (
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-green-600">
                    🎉 Wygrałeś!
                  </p>
                  <p className="text-lg text-foreground">
                    Zdobywasz <span className="font-bold text-primary">+{bet * 2}</span> punktów!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-destructive">
                    😢 Pudło!
                  </p>
                  <p className="text-lg text-foreground">
                    Straciłeś <span className="font-bold text-destructive">{bet}</span> punktów
                  </p>
                </div>
              )}
              <Button onClick={resetGame} size="lg" className="gap-2">
                <Play className="w-5 h-5" />
                Zagraj ponownie
              </Button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold text-foreground mb-2">Jak grać:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>1. Ustaw zakład - ile punktów chcesz postawić</li>
            <li>2. Obserwuj jak kubki są mieszane</li>
            <li>3. Wybierz kubek, pod którym myślisz że jest piłka</li>
            <li>4. Wygraj x2 swojego zakładu lub stracisz punkty!</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};
