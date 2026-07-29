import Link from "next/link";
import Image from "next/image";
import {
  experienceLabel,
  getCurrentProfile,
  profileInitials,
} from "../lib/current-profile";

type NavKey =
  | "inicio"
  | "entrenar"
  | "historial"
  | "progreso"
  | "ejercicios"
  | "perfil";

const navigation: Array<{ key: NavKey; href: string; label: string; icon: string }> = [
  { key: "inicio", href: "/", label: "Inicio", icon: "IN" },
  { key: "entrenar", href: "/entrenar", label: "Entrenar", icon: "EN" },
  { key: "historial", href: "/historial", label: "Historial", icon: "HI" },
  { key: "progreso", href: "/progreso", label: "Progreso", icon: "PR" },
  { key: "ejercicios", href: "/ejercicios", label: "Ejercicios", icon: "EX" },
  { key: "perfil", href: "/perfil", label: "Perfil", icon: "PE" },
];

function Navigation({ current, mobile = false }: { current: NavKey; mobile?: boolean }) {
  return (
    <nav className={mobile ? "mobile-nav" : "main-nav"} aria-label="Navegación principal">
      {navigation.map((item) => (
        <Link
          className={`nav-link ${current === item.key ? "active" : ""}`}
          href={item.href}
          key={item.key}
          aria-current={current === item.key ? "page" : undefined}
        >
          <span className="nav-icon" aria-hidden="true">
            {item.icon}
          </span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export async function AppShell({
  current,
  children,
}: {
  current: NavKey;
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <Image
            alt="Max Level Fitness"
            className="brand-logo"
            height={64}
            src="/max-level-logo.png"
            unoptimized
            width={67}
          />
          <span>
            <strong>Max Level</strong>
            <small>ALCANZA TU MÁXIMO NIVEL</small>
          </span>
        </Link>
        <Navigation current={current} />
        <Link className="sidebar-profile" href="/perfil">
          <span className="avatar">{profileInitials(profile.displayName)}</span>
          <span>
            <strong>{profile.displayName}</strong>
            <small>{experienceLabel(profile.experienceLevel)}</small>
          </span>
          <b aria-hidden="true">›</b>
        </Link>
        <a className="sign-out-link" href="/api/access/logout">
          Salir de este perfil
        </a>
        <div className="sidebar-card">
          <span>MODO PILOTO</span>
          <p>
            Cada recomendación explica qué datos utilizó. Tú mantienes el
            control.
          </p>
          <Link href="/progreso">Cómo funciona →</Link>
        </div>
      </aside>
      <main className="app-main">{children}</main>
      <Navigation current={current} mobile />
    </div>
  );
}
