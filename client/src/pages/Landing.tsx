import Navbar from "../components/landing/Navbar";
import FundoAnimado from "../components/landing/FundoAnimado";
import Hero from "../components/landing/Hero";
import Dores from "../components/landing/Dores";
import ComoFunciona from "../components/landing/ComoFunciona";
import Recursos from "../components/landing/Recursos";
import Confianca from "../components/landing/Confianca";
import Faq from "../components/landing/Faq";
import CtaFinal from "../components/landing/CtaFinal";
import Footer from "../components/landing/Footer";

// ============================================================
// LANDING PAGE pública do OrcaPro
// ============================================================
// Tema escuro: gradiente azul animado em tela cheia (fixo).
// Ordem para entendimento: problema → como resolve →
// o que tem dentro → confiança → dúvidas → ação.
// ============================================================

export default function Landing() {
  return (
    <div className="min-h-screen bg-blue-950 font-sans text-slate-100 antialiased">
      <FundoAnimado />
      <div className="relative">
        <Navbar />
        <main>
          <Hero />
          <Dores />
          <ComoFunciona />
          <Recursos />
          <Confianca />
          <Faq />
          <CtaFinal />
        </main>
        <Footer />
      </div>
    </div>
  );
}
