import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { markTaskAsCompleted } from "@/lib/taskManager";
import squirrelImage from "@/assets/squirrel.png";

const Index = () => {
  const { toast } = useToast();

  const handlePreview = (courseName: string) => {
    // Mark task as completed
    markTaskAsCompleted("2");
    
    toast({
      title: "Podgląd przedmiotu",
      description: `Wyświetlam podgląd: ${courseName}`,
    });
  };

  const courses = [
    {
      title: "2025z Bazy danych lab NS1 sem5 PD",
      meta: "III rok • Semestr zimowy",
    },
    {
      title: "23/24 - Systemy Operacyjne 1 - Wykład",
      meta: "I rok • Wykład",
    },
    {
      title: "25/26 zaoczne - Podstawy inżynierii oprogramowania",
      meta: "Zaoczne • PIO",
    },
  ];

  const tiles = [
    "Strona WEEIA",
    "Strefa pracownika",
    "Strefa studenta",
    "Wsparcie WIKAMP",
    "Centrum IT",
    "Przedmioty",
    "Akty normatywne",
    "Zgłoś problem",
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-sidebar text-sidebar-foreground min-h-screen p-5 sticky top-0">
          <h2 className="text-xl font-bold mb-6">WIKAMP WEEIA</h2>
          <nav className="space-y-2">
            <a href="#" className="block px-3 py-2 rounded-md hover:bg-white/10 transition-colors">
              Kokpit
            </a>
            <a href="#" className="block px-3 py-2 rounded-md hover:bg-white/10 transition-colors">
              Strona główna
            </a>
            <a href="#" className="block px-3 py-2 rounded-md hover:bg-white/10 transition-colors">
              Prywatne pliki
            </a>
            <a href="#" className="block px-3 py-2 rounded-md hover:bg-white/10 transition-colors">
              Moje przedmioty
            </a>
            <a href="#" className="block px-3 py-2 rounded-md hover:bg-white/10 transition-colors">
              2025z Bazy danych lab NS1
            </a>
            <a href="#" className="block px-3 py-2 rounded-md hover:bg-white/10 transition-colors">
              23/24-SO1Z
            </a>
            <a href="#" className="block px-3 py-2 rounded-md hover:bg-white/10 transition-colors">
              25/26 zaoczne PIO
            </a>
            <a href="#" className="block px-3 py-2 rounded-md hover:bg-white/10 transition-colors">
              Dla studentów WEEIA
            </a>
            <a href="#" className="block px-3 py-2 rounded-md hover:bg-white/10 transition-colors">
              Organizacja praktyk
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-8 text-foreground">
            Szkolenia Centrum E-learningu
          </h1>

          {/* Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {tiles.map((tile, index) => (
              <Card
                key={index}
                className="p-4 text-center font-semibold text-primary hover:bg-primary/5 transition-colors cursor-pointer border-2 border-border"
              >
                {tile}
              </Card>
            ))}
          </div>

          {/* Courses Section */}
          <Card className="p-6 border-2 border-border">
            <h3 className="text-2xl font-bold mb-6 text-foreground">
              Przegląd przedmiotów
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course, index) => (
                <Card key={index} className="p-4 bg-card border border-border flex flex-col gap-3">
                  <div className="font-bold text-foreground">{course.title}</div>
                  <div className="text-sm text-muted-foreground">{course.meta}</div>
                  <div className="flex gap-2 mt-auto">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handlePreview(course.title)}
                    >
                      Podgląd
                    </Button>
                    <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90">
                      Wejdź
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </main>
      </div>

      {/* Squirrel Companion - Fixed in corner */}
      <Link to="/companion">
        <div className="fixed bottom-6 right-6 group cursor-pointer z-50">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary to-secondary rounded-full opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300" />
            <div className="relative w-44 h-44 rounded-full overflow-hidden border-4 border-primary/30 shadow-[var(--shadow-hover)] bg-gradient-to-br from-secondary/20 to-primary/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:border-primary">
              <img
                src={squirrelImage}
                alt="Twój wirtualny towarzysz - kliknij aby otworzyć"
                className="w-36 h-36 object-contain"
              />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Kliknij mnie! 🎮
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default Index;
