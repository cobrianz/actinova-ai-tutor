"use client";

import { useParams } from "next/navigation";
import ReportEditor from "../../components/ReportEditor";
import Navbar from "../../components/Navbar";

export default function ReportPage() {
    const { id } = useParams();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <Navbar />
            <div className="pt-2">
                <ReportEditor reportId={id} />
            </div>
        </div>
    );
}
