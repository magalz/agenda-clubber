export default function CollectiveDashboardPage() {
    return (
        <div className="flex min-h-[50vh] flex-col w-full items-center justify-center p-6 md:p-10 gap-4">
            <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 rounded-md p-4 max-w-lg w-full text-center">
                <strong>Status: Pendente</strong>
                <p className="text-sm mt-1">Seu coletivo foi criado com sucesso e está aguardando revisão dos moderadores da Agenda Clubber.</p>
            </div>
            <h1 className="text-3xl font-bold mt-4">Dashboard do Coletivo</h1>
            {/* V1 dashboard contents go here in future epics */}
        </div>
    );
}
