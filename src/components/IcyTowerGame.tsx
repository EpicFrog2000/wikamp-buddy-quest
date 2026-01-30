import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowUp, RefreshCw } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  jumping: boolean;
  width: number;
  height: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  isStartingPlatform?: boolean;
}

interface IcyTowerGameProps {
  onScoreUpdate?: (score: number) => void;
  onPointsChange?: (change: number) => void;
}

export const IcyTowerGame = ({ onScoreUpdate, onPointsChange }: IcyTowerGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const { gameRecords, updateGameRecord } = useProfile();
  
  const icyTowerRecord = gameRecords.find(r => r.game_name === "icyTower");
  const highScore = icyTowerRecord?.high_score || 0;
  
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  const playerRef = useRef<Player>({
    x: 200,
    y: 400,
    vx: 0,
    vy: 0,
    jumping: true,
    width: 20,
    height: 20
  });
  
  const platformsRef = useRef<Platform[]>([]);
  const cameraYRef = useRef(0);
  const keysPressedRef = useRef<Set<string>>(new Set());
  const lastTimestampRef = useRef<number>(0);
  const gameLoopIdRef = useRef<number>(0);

  useEffect(() => {
    const keyDown = (e: KeyboardEvent) => {
      keysPressedRef.current.add(e.key);
      
      if (e.key === " " && gameStarted && !gameOver) {
        e.preventDefault();
      }
    };

    const keyUp = (e: KeyboardEvent) => {
      keysPressedRef.current.delete(e.key);
    };

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, [gameStarted, gameOver]);

  const initPlatforms = useCallback((canvas: HTMLCanvasElement) => {
    const platforms: Platform[] = [];
    const startPlatformY = canvas.height - 100;
    
    const startingPlatform: Platform = {
      x: canvas.width / 2 - 80,
      y: startPlatformY,
      width: 160,
      height: 20,
      isStartingPlatform: true
    };
    
    platforms.push(startingPlatform);
    
    playerRef.current.x = startingPlatform.x + startingPlatform.width / 2 - playerRef.current.width / 2;
    playerRef.current.y = startingPlatform.y - playerRef.current.height;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    playerRef.current.jumping = false;
    
    for (let i = 1; i < 25; i++) {
      const minGap = 50;
      const maxGap = 70;
      const minWidth = 60;
      const maxWidth = 100;
      const previousPlatform = platforms[i - 1];
      
      const maxHorizontalJump = 80;
      const minX = Math.max(0, previousPlatform.x - maxHorizontalJump);
      const maxX = Math.min(canvas.width - minWidth, previousPlatform.x + previousPlatform.width + maxHorizontalJump - minWidth);
      
      platforms.push({
        x: Math.random() * (maxX - minX) + minX,
        y: previousPlatform.y - (Math.random() * (maxGap - minGap) + minGap),
        width: Math.random() * (maxWidth - minWidth) + minWidth,
        height: 12
      });
    }
    
    platformsRef.current = platforms;
  }, []);

  const resetGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    initPlatforms(canvas);
    
    const startingPlatform = platformsRef.current.find(p => p.isStartingPlatform);
    if (startingPlatform) {
      playerRef.current = {
        x: startingPlatform.x + startingPlatform.width / 2 - 10,
        y: startingPlatform.y - 20,
        vx: 0,
        vy: 0,
        jumping: false,
        width: 20,
        height: 20
      };
    }
    
    cameraYRef.current = 0;
    keysPressedRef.current.clear();
    setScore(0);
    setGameOver(false);
  }, [initPlatforms]);

  const start = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setGameStarted(true);
    setGameOver(false);
    
    resetGame();
    
    if (gameLoopIdRef.current) {
      cancelAnimationFrame(gameLoopIdRef.current);
    }
    
    lastTimestampRef.current = performance.now();
  }, [resetGame]);

  const endGame = useCallback(async () => {
    setGameOver(true);
    setGameStarted(false);
    cancelAnimationFrame(gameLoopIdRef.current);
    
    await updateGameRecord("icyTower", score);
    onScoreUpdate?.(score);
    
    const earnedPoints = Math.floor(score / 100);
    if (earnedPoints > 0 && onPointsChange) {
      onPointsChange(earnedPoints);
    }
  }, [score, updateGameRecord, onScoreUpdate, onPointsChange]);

  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !gameStarted || gameOver) return;

    const deltaTime = Math.min(timestamp - lastTimestampRef.current, 32) / 16;
    lastTimestampRef.current = timestamp;

    const player = playerRef.current;
    const platforms = platformsRef.current;
    const keys = keysPressedRef.current;

    const moveSpeed = 6;
    if (keys.has("ArrowLeft") || keys.has("a")) {
      player.vx = -moveSpeed;
    } else if (keys.has("ArrowRight") || keys.has("d")) {
      player.vx = moveSpeed;
    } else {
      player.vx *= 0.8;
      if (Math.abs(player.vx) < 0.5) player.vx = 0;
    }

    if ((keys.has(" ") || keys.has("ArrowUp") || keys.has("w")) && !player.jumping) {
      player.vy = -14;
      player.jumping = true;
    }

    const gravity = 0.8;
    player.vy += gravity * deltaTime;

    player.x += player.vx * deltaTime;
    player.y += player.vy * deltaTime;

    if (player.x < -player.width) {
      player.x = canvas.width;
    } else if (player.x > canvas.width) {
      player.x = -player.width;
    }

    let onPlatform = false;
    const playerBottom = player.y + player.height;
    const playerLeft = player.x;
    const playerRight = player.x + player.width;

    for (const platform of platforms) {
      const platformTop = platform.y;
      const platformLeft = platform.x;
      const platformRight = platform.x + platform.width;

      if (
        player.vy >= 0 &&
        playerBottom >= platformTop &&
        player.y <= platformTop &&
        playerRight > platformLeft &&
        playerLeft < platformRight
      ) {
        player.y = platformTop - player.height;
        player.vy = 0;
        player.jumping = false;
        onPlatform = true;
        player.y -= 1;
        break;
      }
    }

    if (!onPlatform && !player.jumping && player.vy === 0) {
      player.jumping = true;
    }

    const cameraThreshold = canvas.height * 0.4;
    if (player.y < cameraThreshold) {
      const scrollAmount = cameraThreshold - player.y;
      cameraYRef.current += scrollAmount;
      player.y = cameraThreshold;

      for (const platform of platforms) {
        platform.y += scrollAmount;
      }

      const highestPlatformY = Math.min(...platforms.map(p => p.y));
      if (highestPlatformY > -100) {
        const minGap = 50;
        const maxGap = 70;
        const minWidth = 60;
        const maxWidth = 100;
        const topPlatforms = platforms.filter(p => p.y < canvas.height / 2).slice(-5);
        const lastPlatform = topPlatforms[topPlatforms.length - 1] || platforms[platforms.length - 1];
        
        const maxHorizontalJump = 80;
        const minX = Math.max(0, lastPlatform.x - maxHorizontalJump);
        const maxX = Math.min(canvas.width - minWidth, lastPlatform.x + lastPlatform.width + maxHorizontalJump - minWidth);
        
        platforms.push({
          x: Math.random() * (maxX - minX) + minX,
          y: highestPlatformY - (Math.random() * (maxGap - minGap) + minGap),
          width: Math.random() * (maxWidth - minWidth) + minWidth,
          height: 12
        });
      }

      platformsRef.current = platforms.filter(p => p.y < canvas.height + 200);

      const newScore = Math.floor(cameraYRef.current / 5);
      setScore(newScore);
    }

    if (player.y > canvas.height + 100) {
      endGame();
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#E3F2FD");
    gradient.addColorStop(1, "#BBDEFB");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    platforms.forEach((platform) => {
      if (platform.isStartingPlatform) {
        ctx.fillStyle = "rgba(0, 100, 0, 0.2)";
        ctx.fillRect(platform.x + 3, platform.y + 3, platform.width, platform.height);
        
        ctx.fillStyle = "#4CAF50";
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        ctx.strokeStyle = "#1B5E20";
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("START", platform.x + platform.width / 2, platform.y + platform.height / 2 + 4);
      } else {
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(platform.x + 2, platform.y + 2, platform.width, platform.height);
        
        ctx.fillStyle = "#FF8A65";
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        ctx.strokeStyle = "#BF360C";
        ctx.lineWidth = 1;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
      }
    });

    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.ellipse(playerCenterX + 2, player.y + player.height + 3, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const bodyGradient = ctx.createRadialGradient(
      playerCenterX, playerCenterY, 0,
      playerCenterX, playerCenterY, 12
    );
    bodyGradient.addColorStop(0, "#FFB74D");
    bodyGradient.addColorStop(1, "#F57C00");
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(playerCenterX, playerCenterY, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "#FFE0B2";
    ctx.beginPath();
    ctx.ellipse(playerCenterX, playerCenterY + 3, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const eyeOffsetX = player.vx > 0 ? 2 : player.vx < 0 ? -2 : 0;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(playerCenterX - 4 + eyeOffsetX, playerCenterY - 2, 2, 0, Math.PI * 2);
    ctx.arc(playerCenterX + 4 + eyeOffsetX, playerCenterY - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    
    const tailAngle = Math.sin(timestamp / 200) * 0.3;
    ctx.save();
    ctx.translate(playerCenterX + 8, playerCenterY);
    ctx.rotate(tailAngle);
    ctx.fillStyle = "#E65100";
    ctx.beginPath();
    ctx.ellipse(8, 0, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    gameLoopIdRef.current = requestAnimationFrame(gameLoop);
  }, [gameStarted, gameOver, endGame]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      lastTimestampRef.current = performance.now();
      gameLoopIdRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (gameLoopIdRef.current) {
        cancelAnimationFrame(gameLoopIdRef.current);
      }
    };
  }, [gameStarted, gameOver, gameLoop]);

  return (
    <Card className="p-6 bg-gradient-to-b from-card to-background border-2 border-primary/10 shadow-xl">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Wiewiórka w Górę
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Zacznij na platformie START i wspinaj się jak najwyżej!
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground">Rekord: {highScore}</span>
            </div>
            
            {gameStarted && !gameOver && (
              <div className="px-4 py-2 bg-primary text-primary-foreground rounded-full font-bold shadow-lg animate-pulse">
                Wynik: {score}
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={400}
            height={450}
            className="w-full max-w-md mx-auto border-4 border-primary/20 rounded-xl bg-background shadow-lg"
          />

          {!gameStarted && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm rounded-xl">
              <div className="text-center space-y-6 p-8 max-w-sm">
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold">
                    {gameOver ? `Koniec` : "Start"}
                  </h3>
                    {gameOver && (
                      <div>
                        <p className="text-xl font-bold">Wynik: {score}</p>
                        <p className="text-sm">+{Math.floor(score / 100)} pkt</p>
                      {score >= highScore && score > 0 && (
                        <p className="text-sm text-green-600 font-bold">
                          Nowy rekord!
                        </p>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Strzałki/WASD + spacja
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={start}
                    size="lg"
                    className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                  >
                    {gameOver ? <RefreshCw className="w-5 h-5" /> : <ArrowUp className="w-5 h-5" />}
                    {gameOver ? "Zagraj ponownie" : "Rozpocznij grę"}
                  </Button>
                  
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-background rounded border text-xs">←</kbd>
                      <kbd className="px-2 py-1 bg-background rounded border text-xs">→</kbd>
                      <span>lub</span>
                      <kbd className="px-2 py-1 bg-background rounded border text-xs">A</kbd>
                      <kbd className="px-2 py-1 bg-background rounded border text-xs">D</kbd>
                      <span>Ruch</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-background rounded border text-xs">Space</kbd>
                      <span>lub</span>
                      <kbd className="px-2 py-1 bg-background rounded border text-xs">↑</kbd>
                      <span>Skok</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
