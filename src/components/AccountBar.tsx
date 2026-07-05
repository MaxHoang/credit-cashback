import { useState } from "react";
import { isLoggedIn, loginWithGoogle, logout, currentUser } from "../lib/pb";

export function AccountBar({ onAuthChange, onOpenSettings }: { onAuthChange: () => void; onOpenSettings: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const user = currentUser();
  if (isLoggedIn() && user) {
    return (
      <div className="account-bar">
        <span>👤 {(user as { email?: string }).email ?? "Tài khoản"}</span>
        <button onClick={onOpenSettings}>Thẻ của tôi</button>
        <button onClick={() => { logout(); onAuthChange(); }}>Đăng xuất</button>
      </div>
    );
  }
  return (
    <div className="account-bar">
      <button disabled={busy} onClick={async () => {
        setBusy(true); setErr("");
        try { await loginWithGoogle(); onAuthChange(); }
        catch { setErr("Đăng nhập thất bại (backend chưa sẵn sàng?)"); }
        finally { setBusy(false); }
      }}>Đăng nhập với Google</button>
      {err && <span className="muted">{err}</span>}
    </div>
  );
}
