export async function AuthGuard(req: Request) {
  const token = req.headers.get("authorization");

  if (!token || token !== "Bearer valid-token") {
    throw new Error("Unauthorized");
  }

  return { id: 1, name: "Demo User", role: "user" };
}

export async function AdminGuard(req: Request) {
  const user = await AuthGuard(req);
  if (user.role !== "admin") throw new Error("Forbidden - Admins only");
  return user;
}
