import type { Metadata } from "next";
import { AppShell } from "../components/AppShell";
import { getCurrentProfile } from "../lib/current-profile";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = {
  title: "Perfil",
  description: "Edita los datos que personalizan tus recomendaciones.",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();

  return (
    <AppShell current="perfil">
      <header className="section-header profile-page-header">
        <div>
          <p className="eyebrow">TU CONFIGURACIÓN</p>
          <h1>Un perfil que entrena contigo.</h1>
          <p>
            Estos datos ajustan el volumen, las cargas y las recomendaciones.
            Puedes cambiarlos cuando quieras.
          </p>
        </div>
        <span className="privacy-badge">
          <i />
          Solo visible para tu cuenta
        </span>
      </header>
      <ProfileForm initialProfile={profile} />
    </AppShell>
  );
}
