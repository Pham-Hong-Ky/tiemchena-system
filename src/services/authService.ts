import { cookies } from "next/headers";
import { verifyCredentials, createSessionToken, verifySessionToken, COOKIE_NAME } from "@/lib/auth";

export const authService = {
  async login(username: string, password: string) {
    if (!username || !password) {
      throw new Error("Vui lòng nhập tài khoản và mật khẩu quản trị");
    }

    const isValid = verifyCredentials(username, password);
    if (!isValid) {
      throw new Error("Tên đăng nhập hoặc mật khẩu không chính xác");
    }

    const token = await createSessionToken(username);
    return { token, username };
  },

  async verifyCurrentSession(): Promise<boolean> {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get(COOKIE_NAME)?.value;
      return await verifySessionToken(token);
    } catch {
      return false;
    }
  },
};
