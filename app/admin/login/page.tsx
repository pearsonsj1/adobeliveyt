import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy URL: sign-in lives at `/admin-signin` so nested `/admin/login` is never a 404 on odd hosts. */
export default function AdminLoginLegacyRedirect({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const q = new URLSearchParams();
  const next = searchParams.next;
  const error = searchParams.error;
  if (typeof next === "string") q.set("next", next);
  if (typeof error === "string") q.set("error", error);
  redirect(`/admin-signin${q.size ? `?${q.toString()}` : ""}`);
}
