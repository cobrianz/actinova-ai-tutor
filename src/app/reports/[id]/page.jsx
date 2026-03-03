"use client";

import { useParams } from "next/navigation";
import ReportEditor from "../../components/ReportEditor";
import DashboardLayout from "../../components/DashboardLayout";

export default function ReportPage() {
    const { id } = useParams();

    return (
        <DashboardLayout activeContent="reports-library">
            <ReportEditor reportId={id} />
        </DashboardLayout>
    );
}
