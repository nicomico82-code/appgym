import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAccessIdentity } from "../access-session";
import { AccessGateway } from "./AccessGateway";

export const metadata: Metadata = {
  title: "Acceso personal",
  description: "Abre tu espacio privado de entrenamiento.",
};

export const dynamic = "force-dynamic";

export default async function AccessPage() {
  const identity = await getAccessIdentity();
  if (identity) redirect("/");
  return <AccessGateway />;
}
