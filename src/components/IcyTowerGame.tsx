import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowUp } from "lucide-react";

export const IcyTowerGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  const playerRef = useRef({ x: 200, y: 400, vx: 0, vy: 0, jumping: false });
  const platformsRef = useRef<Array<{ x: number; y: number; width: number }>>([]);
  const cameraYRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize platforms
    const initPlatforms = () => {
      platformsRef.current = [];
      for (let i = 0; i < 15; i++) {
        platformsRef.current.push({
          x: Math.random() * (canvas.width - 100),
          y: canvas.height - i * 60,
          width: 80 + Math.random() * 40,
        });
      }
    };

    const resetGame = () => {
      playerRef.current = { x: 200, y: 400, vx: 0, vy: 0, jumping: false };
      cameraYRef.current = 0;
      setScore(0);
      setGameOver(false);
      initPlatforms();
    };

    if (gameStarted && !gameOver) {
      initPlatforms();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;
      
      const player = playerRef.current;
      if (e.key === "ArrowLeft") player.vx = -5;
      if (e.key === "ArrowRight") player.vx = 5;
      if (e.key === " " && !player.jumping) {
        player.vy = -15;
        player.jumping = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        playerRef.current.vx = 0;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let animationId: number;

    const gameLoop = () => {
      if (!gameStarted || gameOver) return;

      const player = playerRef.current;
      const platforms = platformsRef.current;

      // Update player position
      player.x += player.vx;
      player.vy += 0.6; // Gravity
      player.y += player.vy;

      // Wrap around screen
      if (player.x < -20) player.x = canvas.width;
      if (player.x > canvas.width) player.x = -20;

      // Check platform collisions
      let onPlatform = false;
      platforms.forEach((platform) => {
        if (
          player.y + 20 >= platform.y &&
          player.y + 20 <= platform.y + 10 &&
          player.x + 20 >= platform.x &&
          player.x <= platform.x + platform.width &&
          player.vy >= 0
        ) {
          player.y = platform.y - 20;
          player.vy = 0;
          player.jumping = false;
          onPlatform = true;
        }
      });

      // Camera follow
      if (player.y < canvas.height / 2) {
        const diff = canvas.height / 2 - player.y;
        cameraYRef.current += diff;
        player.y = canvas.height / 2;

        platforms.forEach((p) => {
          p.y += diff;
        });

        // Add new platforms at the top
        while (platforms[platforms.length - 1].y > -60) {
          platforms.push({
            x: Math.random() * (canvas.width - 100),
            y: platforms[platforms.length - 1].y - 60,
            width: 80 + Math.random() * 40,
          });
        }

        // Remove platforms that are off-screen at the bottom
        platformsRef.current = platforms.filter((p) => p.y < canvas.height + 100);

        // Update score
        const newScore = Math.floor(cameraYRef.current / 10);
        setScore(newScore);
        if (newScore > highScore) {
          setHighScore(newScore);
        }
      }

      // Game over condition
      if (player.y > canvas.height) {
        setGameOver(true);
        setGameStarted(false);
      }

      // Clear canvas
      ctx.fillStyle = "#F5E6D3";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw platforms
      platforms.forEach((platform) => {
        ctx.fillStyle = "#ED814B";
        ctx.fillRect(platform.x, platform.y, platform.width, 10);
        ctx.fillStyle = "#D96F3E";
        ctx.fillRect(platform.x, platform.y + 10, platform.width, 2);
      });

      // Draw player (squirrel-colored circle)
      ctx.fillStyle = "#ED814B";
      ctx.beginPath();
      ctx.arc(player.x + 10, player.y + 10, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // Add details
      ctx.fillStyle = "#D96F3E";
      ctx.beginPath();
      ctx.arc(player.x + 10, player.y + 10, 8, 0, Math.PI * 2);
      ctx.fill();

      animationId = requestAnimationFrame(gameLoop);
    };

    if (gameStarted && !gameOver) {
      gameLoop();
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animationId);
    };
  }, [gameStarted, gameOver, highScore]);

  const startGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create platforms with first one under player
    platformsRef.current = [];
    const startPlatformX = 150; // Fixed position for start platform
    const startPlatformY = canvas.height - 60;
    const startPlatformWidth = 120; // Wider start platform
    
    // Add starting platform
    platformsRef.current.push({
      x: startPlatformX,
      y: startPlatformY,
      width: startPlatformWidth,
    });
    
    // Add remaining platforms above
    for (let i = 1; i < 15; i++) {
      platformsRef.current.push({
        x: Math.random() * (canvas.width - 100),
        y: startPlatformY - i * 60,
        width: 80 + Math.random() * 40,
      });
    }
    
    // Position player on top of starting platform
    playerRef.current = { 
      x: startPlatformX + startPlatformWidth / 2 - 10, 
      y: startPlatformY - 20, 
      vx: 0, 
      vy: 0, 
      jumping: false 
    };
    cameraYRef.current = 0;
    
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  return (
    <Card className="p-6 bg-gradient-to-b from-card to-background border-2 border-primary/10">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Mini Gra: Wiewiórka w Górę!</h2>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">Rekord: {highScore}</span>
          </div>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={400}
            height={500}
            className="w-full border-4 border-primary/20 rounded-xl bg-background"
          />

          {!gameStarted && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-bold text-foreground">
                  {gameOver ? `Wynik: ${score}` : "Gotowy do skoku?"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Użyj strzałek ← → do ruchu i spacji do skoku. Wspinaj się jak najwyżej!
                </p>
                <Button
                  onClick={startGame}
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                >
                  <ArrowUp className="w-5 h-5 mr-2" />
                  {gameOver ? "Zagraj ponownie" : "Start"}
                </Button>
              </div>
            </div>
          )}

          {gameStarted && !gameOver && (
            <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold shadow-lg">
              Wynik: {score}
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground text-center">
          Sterowanie: Strzałki ← → (ruch), Spacja (skok)
        </div>
      </div>
    </Card>
  );
};
