import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useJobOpenings, usePipeline } from "./hooks/useRecruitment"
import { JobOpeningsSidebar } from "./components/JobOpeningsSidebar"
import { KanbanBoard } from "./components/KanbanBoard"
import { CandidateDetailDrawer } from "./components/CandidateDetailDrawer"
import { AddCandidateModal } from "./components/AddCandidateModal"
import { AIJobDescriptionGenerator } from "./components/AIJobDescriptionGenerator"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"

export function RecruitmentPage() {
  const { jobOpening: jobOpeningParam } = useParams<{ jobOpening?: string }>()
  const navigate = useNavigate()

  const { data: openingsData, isLoading: openingsLoading } = useJobOpenings("Open")
  const { data: closedData } = useJobOpenings("Closed")

  const allOpenings = [
    ...(openingsData?.job_openings ?? []),
    ...(closedData?.job_openings ?? []),
  ]

  const selectedJobOpening = jobOpeningParam ?? null
  const { data: pipeline, isLoading: pipelineLoading } = usePipeline(selectedJobOpening)

  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null)
  const [addCandidateOpen, setAddCandidateOpen] = useState(false)
  const [createJobOpen, setCreateJobOpen] = useState(false)

  function handleSelectJob(name: string) {
    navigate(`/recruitment/${name}`)
  }

  return (
    <div className="flex h-full overflow-hidden">
      <JobOpeningsSidebar
        jobOpenings={allOpenings}
        selectedJobOpening={selectedJobOpening}
        onSelect={handleSelectJob}
        onCreateNew={() => setCreateJobOpen(true)}
        isLoading={openingsLoading}
      />

      {/* Content area — relative so the inline drawer is contained here */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!selectedJobOpening ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            Select a job opening to view the pipeline
          </div>
        ) : pipelineLoading || !pipeline ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">Loading pipeline…</div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-3 border-b bg-white shrink-0">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{pipeline.job_opening.job_title}</h2>
                <p className="text-xs text-gray-500">{pipeline.job_opening.department} · {pipeline.job_opening.designation}</p>
              </div>
              <Button size="sm" onClick={() => setAddCandidateOpen(true)} className="gap-1.5">
                <UserPlus size={14} />
                Add Candidate
              </Button>
            </div>

            <KanbanBoard pipeline={pipeline} onCardClick={setSelectedCandidate} />
          </>
        )}

        {/* Inline drawer — only mounted when a candidate is selected */}
        {selectedCandidate && (
          <CandidateDetailDrawer
            candidateName={selectedCandidate}
            open={true}
            onClose={() => setSelectedCandidate(null)}
            jobOpeningName={selectedJobOpening ?? undefined}
          />
        )}
      </div>

      {selectedJobOpening && (
        <AddCandidateModal
          open={addCandidateOpen}
          jobOpeningName={selectedJobOpening}
          onClose={() => setAddCandidateOpen(false)}
        />
      )}

      <AIJobDescriptionGenerator
        open={createJobOpen}
        onClose={() => setCreateJobOpen(false)}
        onCreated={handleSelectJob}
      />
    </div>
  )
}
