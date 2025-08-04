import { ResetPasswordForm } from "@/components/reset-password-form";
import Unauthorized from "@/components/unauthorized";

const ResetPasswordPage = ({
  searchParams,
}: {
  searchParams: { token?: string };
}) => {
  if (!searchParams.token) return <Unauthorized />;

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ResetPasswordForm token={searchParams.token} />
      </div>
    </div>
  );
};

export default ResetPasswordPage;
