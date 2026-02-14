import Layout from "@/components/layout";
import ChatWidget from "@/components/ChatWidget";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Layout>
            {children}
            <ChatWidget />
        </Layout>
    );
}
