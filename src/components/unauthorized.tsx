import Link from "next/link";

export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <h1 className="text-2xl font-semibold text-red-500">Unauthorized</h1>
      <p className="text-muted-foreground">
        You are not allowed to access this page.
      </p>
      <Link
        href="/login"
        className="text-blue-600 hover:underline underline-offset-4"
      >
        Go to Login
      </Link>
    </div>
  );
}
