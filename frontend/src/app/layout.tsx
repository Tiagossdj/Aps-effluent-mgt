import type { Metadata } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Conformidade de Efluentes | CONAMA 430/2011",
  description:
    "Dashboard de monitoramento de efluentes industriais: pH, DBO, DQO, temperatura, sólidos suspensos e óleos e graxas frente aos limites da Resolução CONAMA 430/2011.",
};

// Tema escuro é o padrão (classe `dark` já vem no HTML servido). Este script
// roda de forma bloqueante antes do primeiro paint e só remove a classe se
// houver preferência salva por tema claro — evita flash do tema errado.
const themeInitScript = `(function(){try{if(localStorage.getItem("theme")==="light")document.documentElement.classList.remove("dark")}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${manrope.variable} ${jetBrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
