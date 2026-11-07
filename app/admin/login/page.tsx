import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { loginAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: { err?: string } }) {
  if (await getSession()) redirect("/admin");
  return (
    <form className="login" action={loginAction}>
      <h1 style={{ fontSize: "1.4rem", marginBottom: 16 }}>دخول لوحة التحكم</h1>
      {searchParams.err ? (
        <p className="toast bad" role="alert">
          {searchParams.err}
        </p>
      ) : null}
      <div className="field">
        <label htmlFor="email">البريد الإلكتروني</label>
        <input id="email" name="email" type="email" required autoComplete="username" dir="ltr" />
      </div>
      <div className="field">
        <label htmlFor="password">كلمة السر</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" dir="ltr" />
      </div>
      <button className="btn block">دخول</button>
    </form>
  );
}
