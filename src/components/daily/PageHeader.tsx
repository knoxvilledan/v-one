// Server Component for page header

interface PageHeaderProps {
  session: {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  } | null;
}

export default function PageHeader({ session }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold mb-4 lg:mb-0">AMP Tracker</h1>
        <div className="flex items-center">
          <span className="text-base lg:text-lg font-medium">
            Welcome, {session?.user?.name || "User"}
          </span>
        </div>
      </div>
    </div>
  );
}
