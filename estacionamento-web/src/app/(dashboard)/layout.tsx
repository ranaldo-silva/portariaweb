import Layout from "@/components/layout";
import ChatWidget from "@/components/ChatWidget";
import { MotoConsultaFAB } from "@/components/MotoConsultaFAB";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Layout>
            {children}
            <ChatWidget />
            <MotoConsultaFAB />
        </Layout>
    );
}
