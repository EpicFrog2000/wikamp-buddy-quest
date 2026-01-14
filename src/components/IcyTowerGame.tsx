import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowUp, RefreshCw } from "lucide-react";

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

export const IcyTowerGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    // Load high score from localStorage if available
    const saved = localStorage.getItem("icyTowerHighScore");
    return saved ? parseInt(saved, 10) : 0;
  });
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

  // Save high score to localStorage when it changes
  useEffect(() => {
    if (highScore > 0) {
      localStorage.setItem("icyTowerHighScore", highScore.toString());
    }
  }, [highScore]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current.add(e.key);
      
      if (e.key === " " && gameStarted && !gameOver) {
        e.preventDefault(); // Prevent spacebar from scrolling page
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current.delete(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameStarted, gameOver]);

  // Game initialization - UPDATED to ensure player starts on platform
  const initPlatforms = useCallback((canvas: HTMLCanvasElement) => {
    const platforms: Platform[] = [];
    const startPlatformY = canvas.height - 100; // Starting position higher
    
    // Create wider and more visible starting platform
    const startingPlatform: Platform = {
      x: canvas.width / 2 - 80, // Centered and wider
      y: startPlatformY,
      width: 160,
      height: 20,
      isStartingPlatform: true
    };
    
    platforms.push(startingPlatform);
    
    // Position player exactly on top of the starting platform
    playerRef.current.x = startingPlatform.x + startingPlatform.width / 2 - playerRef.current.width / 2;
    playerRef.current.y = startingPlatform.y - playerRef.current.height;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    playerRef.current.jumping = false; // Player is standing on platform
    
    // Create initial stack of platforms above
    for (let i = 1; i < 25; i++) {
      const minGap = 50;
      const maxGap = 70;
      const minWidth = 60;
      const maxWidth = 100;
      const previousPlatform = platforms[i - 1];
      
      // Ensure platforms are reachable (not too far horizontally)
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
    
    // First initialize platforms to get starting platform position
    initPlatforms(canvas);
    
    // Then ensure player is properly positioned on starting platform
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

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Reset game state
    setGameStarted(true);
    setGameOver(false);
    
    // Initialize platforms and position player
    resetGame();
    
    // Start game loop
    if (gameLoopIdRef.current) {
      cancelAnimationFrame(gameLoopIdRef.current);
    }
    
    lastTimestampRef.current = performance.now();
  }, [resetGame]);

  const endGame = useCallback(() => {
    setGameOver(true);
    setGameStarted(false);
    if (score > highScore) {
      setHighScore(score);
    }
    cancelAnimationFrame(gameLoopIdRef.current);
  }, [score, highScore]);

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !gameStarted || gameOver) return;

    // Calculate delta time for consistent physics
    const deltaTime = Math.min(timestamp - lastTimestampRef.current, 32) / 16;
    lastTimestampRef.current = timestamp;

    const player = playerRef.current;
    const platforms = platformsRef.current;
    const keys = keysPressedRef.current;

    // Handle player input with smoother acceleration
    const moveSpeed = 6;
    if (keys.has("ArrowLeft") || keys.has("a")) {
      player.vx = -moveSpeed;
    } else if (keys.has("ArrowRight") || keys.has("d")) {
      player.vx = moveSpeed;
    } else {
      // Apply friction when no keys are pressed
      player.vx *= 0.8;
      if (Math.abs(player.vx) < 0.5) player.vx = 0;
    }

    // Handle jumping - only if on platform
    if ((keys.has(" ") || keys.has("ArrowUp") || keys.has("w")) && !player.jumping) {
      player.vy = -14;
      player.jumping = true;
    }

    // Apply gravity
    const gravity = 0.8;
    player.vy += gravity * deltaTime;

    // Update player position
    player.x += player.vx * deltaTime;
    player.y += player.vy * deltaTime;

    // Screen boundaries (wrap around)
    if (player.x < -player.width) {
      player.x = canvas.width;
    } else if (player.x > canvas.width) {
      player.x = -player.width;
    }

    // Check platform collisions
    let onPlatform = false;
    const playerBottom = player.y + player.height;
    const playerLeft = player.x;
    const playerRight = player.x + player.width;

    for (const platform of platforms) {
      const platformTop = platform.y;
      const platformBottom = platform.y + platform.height;
      const platformLeft = platform.x;
      const platformRight = platform.x + platform.width;

      // Check if player is above platform and falling
      if (
        player.vy >= 0 &&
        playerBottom >= platformTop &&
        player.y <= platformTop &&
        playerRight > platformLeft &&
        playerLeft < platformRight
      ) {
        // Land on platform
        player.y = platformTop - player.height;
        player.vy = 0;
        player.jumping = false;
        onPlatform = true;
        
        // Small bounce effect when landing
        player.y -= 1;
        break;
      }
    }

    // If not on any platform and not jumping, start falling
    if (!onPlatform && !player.jumping && player.vy === 0) {
      player.jumping = true;
    }

    // Camera follow and world scrolling
    const cameraThreshold = canvas.height * 0.4;
    if (player.y < cameraThreshold) {
      const scrollAmount = cameraThreshold - player.y;
      cameraYRef.current += scrollAmount;
      player.y = cameraThreshold;

      // Move all platforms down
      for (const platform of platforms) {
        platform.y += scrollAmount;
      }

      // Generate new platforms at the top
      const highestPlatformY = Math.min(...platforms.map(p => p.y));
      if (highestPlatformY > -100) {
        const minGap = 50;
        const maxGap = 70;
        const minWidth = 60;
        const maxWidth = 100;
        const topPlatforms = platforms.filter(p => p.y < canvas.height / 2).slice(-5);
        const lastPlatform = topPlatforms[topPlatforms.length - 1] || platforms[platforms.length - 1];
        
        // Ensure new platforms are reachable
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

      // Remove platforms that are far below the screen
      platformsRef.current = platforms.filter(p => p.y < canvas.height + 200);

      // Update score
      const newScore = Math.floor(cameraYRef.current / 5);
      setScore(newScore);
    }

    // Game over condition - player falls below starting platform area
    if (player.y > canvas.height + 100) {
      endGame();
      return;
    }

    // Render everything
    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#E3F2FD");
    gradient.addColorStop(1, "#BBDEFB");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw platforms
    platforms.forEach((platform) => {
      // Highlight starting platform
      if (platform.isStartingPlatform) {
        // Starting platform shadow
        ctx.fillStyle = "rgba(0, 100, 0, 0.2)";
        ctx.fillRect(platform.x + 3, platform.y + 3, platform.width, platform.height);
        
        // Starting platform gradient (greenish)
        const platformGradient = ctx.createLinearGradient(
          platform.x, platform.y,
          platform.x, platform.y + platform.height
        );
        platformGradient.addColorStop(0, "#4CAF50");
        platformGradient.addColorStop(1, "#2E7D32");
        ctx.fillStyle = platformGradient;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Starting platform border
        ctx.strokeStyle = "#1B5E20";
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        
        // Draw "START" text on starting platform
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("START", platform.x + platform.width / 2, platform.y + platform.height / 2 + 4);
      } else {
        // Regular platform shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(platform.x + 2, platform.y + 2, platform.width, platform.height);
        
        // Main platform
        const platformGradient = ctx.createLinearGradient(
          platform.x, platform.y,
          platform.x, platform.y + platform.height
        );
        platformGradient.addColorStop(0, "#FF8A65");
        platformGradient.addColorStop(1, "#D84315");
        ctx.fillStyle = platformGradient;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Platform border
        ctx.strokeStyle = "#BF360C";
        ctx.lineWidth = 1;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
      }
    });

    // Draw player (squirrel) with more details
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    
    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.ellipse(playerCenterX + 2, player.y + player.height + 3, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Body
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
    
    // Belly
    ctx.fillStyle = "#FFE0B2";
    ctx.beginPath();
    ctx.ellipse(playerCenterX, playerCenterY + 3, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    const eyeOffsetX = player.vx > 0 ? 2 : player.vx < 0 ? -2 : 0;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(playerCenterX - 4 + eyeOffsetX, playerCenterY - 2, 2, 0, Math.PI * 2);
    ctx.arc(playerCenterX + 4 + eyeOffsetX, playerCenterY - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Tail (with movement based on velocity)
    const tailAngle = Math.sin(timestamp / 200) * 0.3;
    ctx.save();
    ctx.translate(playerCenterX + 8, playerCenterY);
    ctx.rotate(tailAngle);
    ctx.fillStyle = "#E65100";
    ctx.beginPath();
    ctx.ellipse(8, 0, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Continue game loop
    gameLoopIdRef.current = requestAnimationFrame(gameLoop);
  }, [gameStarted, gameOver, endGame]);

  // Start game loop when game starts
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
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              🐿️ Wiewiórka w Górę!
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
                  <h3 className="text-2xl font-bold text-foreground">
                    {gameOver ? `Koniec gry!` : "Wspinaczka wiewiórki!"}
                  </h3>
                  {gameOver && (
                    <div className="space-y-2">
                      <p className="text-xl font-bold text-primary">
                        Twój wynik: {score}
                      </p>
                      {score === highScore && (
                        <p className="text-sm text-green-600 font-bold">
                          🎉 Nowy rekord!
                        </p>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Zaczniesz na zielonej platformie START.<br />
                    Użyj strzałek lub WASD do ruchu i spacji do skoku.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={startGame}
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 h-12 text-lg"
                  >
                    <ArrowUp className="w-5 h-5 mr-2" />
                    {gameOver ? "Zagraj ponownie" : "Rozpocznij grę"}
                  </Button>
                  
                  {gameOver && (
                    <Button
                      onClick={resetGame}
                      variant="outline"
                      size="lg"
                      className="w-full h-12"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Resetuj grę
                    </Button>
                  )}
                </div>
                
                <div className="pt-4 border-t border-border">
                  <h4 className="font-semibold text-sm mb-2">Sterowanie:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted p-2 rounded text-center">
                      <div className="font-bold">← → / A D</div>
                      <div className="text-muted-foreground">Ruch</div>
                    </div>
                    <div className="bg-muted p-2 rounded text-center">
                      <div className="font-bold">Spacja / W / ↑</div>
                      <div className="text-muted-foreground">Skok</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
          <div className="bg-muted/50 p-3 rounded-lg text-center">
            <div className="font-bold text-primary">Start gry</div>
            <div>Zaczynasz zawsze na zielonej platformie START</div>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg text-center">
            <div className="font-bold text-primary">Mechanika</div>
            <div>Skacz z platformy na platformę</div>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg text-center">
            <div className="font-bold text-primary">Punkty</div>
            <div>1 punkt za każde 5 pikseli wysokości</div>
          </div>
        </div>
      </div>
    </Card>
  );
};
