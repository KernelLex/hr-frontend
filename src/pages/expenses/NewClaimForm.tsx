import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSubmitClaim } from "./useExpenses"
import type { ClaimType } from "./types"

export function NewClaimForm() {
  const navigate = useNavigate()
  const submitClaim = useSubmitClaim()

  const [claimType, setClaimType] = useState<ClaimType | null>(null)
  const [form, setForm] = useState({
    claim_date: new Date().toISOString().slice(0, 10),
    amount: "",
    purpose: "",
    // Petrol
    km_driven: "",
    vehicle_number: "",
    route_from: "",
    route_to: "",
    fuel_receipt: "",
    // Material
    material_description: "",
    vendor_name: "",
    material_receipt: "",
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!claimType) return

    const payload: Record<string, unknown> = {
      claim_type: claimType,
      claim_date: form.claim_date,
      amount: parseFloat(form.amount) || 0,
      purpose: form.purpose,
    }

    if (claimType === "Petrol") {
      if (form.km_driven) payload.km_driven = parseFloat(form.km_driven)
      if (form.vehicle_number) payload.vehicle_number = form.vehicle_number
      if (form.route_from) payload.route_from = form.route_from
      if (form.route_to) payload.route_to = form.route_to
      if (form.fuel_receipt) payload.fuel_receipt = form.fuel_receipt
    } else {
      if (form.material_description) payload.material_description = form.material_description
      if (form.vendor_name) payload.vendor_name = form.vendor_name
      if (form.material_receipt) payload.material_receipt = form.material_receipt
    }

    await submitClaim.mutateAsync(payload)
    navigate("/expenses")
  }

  if (!claimType) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <button onClick={() => navigate("/expenses")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6">
          <ArrowLeft size={14} /> Back
        </button>
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Submit Expense Claim</h1>
        <p className="text-sm text-gray-600 mb-4">Choose claim type:</p>
        <div className="grid grid-cols-2 gap-4">
          <button
            className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
            onClick={() => setClaimType("Petrol")}
          >
            <span className="text-4xl">⛽</span>
            <div className="text-center">
              <p className="font-semibold text-gray-900 group-hover:text-blue-700">Petrol Claim</p>
              <p className="text-xs text-gray-500 mt-1">Fuel expenses for travel</p>
            </div>
          </button>
          <button
            className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all group"
            onClick={() => setClaimType("Material")}
          >
            <span className="text-4xl">📦</span>
            <div className="text-center">
              <p className="font-semibold text-gray-900 group-hover:text-purple-700">Material Claim</p>
              <p className="text-xs text-gray-500 mt-1">Purchases &amp; supplies</p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button onClick={() => setClaimType(null)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4">
        <ArrowLeft size={14} /> Change type
      </button>

      <Card className="bg-white shadow-md border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center gap-2">
            {claimType === "Petrol" ? "⛽" : "📦"} {claimType} Claim
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="claim_date">Date *</Label>
                <Input id="claim_date" type="date" value={form.claim_date}
                  onChange={(e) => set("claim_date", e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input id="amount" type="number" min="0" step="0.01"
                  placeholder="0.00" value={form.amount}
                  onChange={(e) => set("amount", e.target.value)} required />
              </div>
            </div>

            {claimType === "Petrol" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="km_driven">KM Driven *</Label>
                    <Input id="km_driven" type="number" min="0" step="0.1"
                      placeholder="0" value={form.km_driven}
                      onChange={(e) => set("km_driven", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="vehicle_number">Vehicle Number</Label>
                    <Input id="vehicle_number" placeholder="KA 01 AB 1234"
                      value={form.vehicle_number}
                      onChange={(e) => set("vehicle_number", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="route_from">From</Label>
                    <Input id="route_from" placeholder="Office"
                      value={form.route_from}
                      onChange={(e) => set("route_from", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="route_to">To</Label>
                    <Input id="route_to" placeholder="Client Site"
                      value={form.route_to}
                      onChange={(e) => set("route_to", e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {claimType === "Material" && (
              <>
                <div>
                  <Label htmlFor="material_description">Material Description *</Label>
                  <textarea id="material_description"
                    className="w-full min-h-[80px] px-3 py-2 text-sm border border-gray-200 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe what was purchased..."
                    value={form.material_description}
                    onChange={(e) => set("material_description", e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="vendor_name">Vendor / Shop Name</Label>
                  <Input id="vendor_name" placeholder="Where was it purchased?"
                    value={form.vendor_name}
                    onChange={(e) => set("vendor_name", e.target.value)} />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="purpose">Purpose *</Label>
              <textarea id="purpose"
                className="w-full min-h-[80px] px-3 py-2 text-sm border border-gray-200 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={claimType === "Petrol" ? "Why was this trip made? e.g. Client visit for project X" : "What was this for? e.g. Office supplies for project Y"}
                value={form.purpose}
                onChange={(e) => set("purpose", e.target.value)} required />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitClaim.isPending} className="flex-1">
                {submitClaim.isPending ? "Submitting…" : "Submit Claim"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/expenses")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
