"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trash2, CalendarIcon, LineChart, Save } from "lucide-react"
import { toast } from "sonner"

type MoodEntry = {
  _id?: string
  userId?: string
  date: string // normalized yyyy-mm-dd for UI
  mood: string
  intensity: number
  triggers: string[]
  activities: string[]
  notes: string
}

const MOODS = ["happy", "sad", "anxious", "angry", "lonely", "confused", "hopeful", "tired", "neutral"]

function toUiDate(value: string | Date) {
  const d = new Date(value)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(d.getUTCDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function fromUiDateToISOString(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map((n) => Number.parseInt(n, 10))
  const iso = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 0, 0, 0, 0)).toISOString()
  return iso
}

export function MoodTracking() {
  const [entries, setEntries] = useState<MoodEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [date, setDate] = useState<string>(() => toUiDate(new Date()))
  const [mood, setMood] = useState<string>("neutral")
  const [intensity, setIntensity] = useState<number>(5)
  const [triggersInput, setTriggersInput] = useState<string>("")
  const [activitiesInput, setActivitiesInput] = useState<string>("")
  const [notes, setNotes] = useState<string>("")

  const todaysEntry = useMemo(() => {
    return (entries || []).find((e) => e.date === date)
  }, [entries, date])

  // Load entries on mount
  useEffect(() => {
    void loadEntries()
  }, [])

  // If an entry for today exists, hydrate the form for easy update
  useEffect(() => {
    if (todaysEntry) {
      setMood(todaysEntry.mood)
      setIntensity(todaysEntry.intensity)
      setTriggersInput((todaysEntry.triggers || []).join(", "))
      setActivitiesInput((todaysEntry.activities || []).join(", "))
      setNotes(todaysEntry.notes || "")
    } else {
      setMood("neutral")
      setIntensity(5)
      setTriggersInput("")
      setActivitiesInput("")
      setNotes("")
    }
  }, [todaysEntry])

  async function loadEntries() {
    try {
      setLoading(true)
      const res = await fetch("/api/mood-entries", { credentials: "include" })
      if (!res.ok) {
        throw new Error("Failed to fetch mood entries")
      }
      const data = await res.json()
      const list = Array.isArray(data?.moodEntries)
        ? data.moodEntries
        : Array.isArray(data?.entries)
          ? data.entries
          : []

      const normalized: MoodEntry[] = (list || []).map((e: any) => ({
        _id: e._id,
        userId: e.userId,
        date: toUiDate(e.date),
        mood: e.mood || "neutral",
        intensity: typeof e.intensity === "number" ? e.intensity : 5,
        triggers: Array.isArray(e.triggers) ? e.triggers : [],
        activities: Array.isArray(e.activities) ? e.activities : [],
        notes: typeof e.notes === "string" ? e.notes : "",
      }))

      normalized.sort((a, b) => a.date.localeCompare(b.date))
      setEntries(normalized)
    } catch (err) {
      console.error(err)
      toast.error("Could not load mood entries")
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      setSaving(true)
      const payload = {
        date: fromUiDateToISOString(date),
        mood,
        intensity: Number(intensity),
        triggers: (triggersInput || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        activities: (activitiesInput || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        notes,
      }

      const res = await fetch("/api/mood-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Failed to save mood entry")
      }

      const saved = data?.moodEntry
      if (saved) {
        const savedUi: MoodEntry = {
          _id: saved._id,
          userId: saved.userId,
          date: toUiDate(saved.date),
          mood: saved.mood || mood,
          intensity: typeof saved.intensity === "number" ? saved.intensity : intensity,
          triggers: Array.isArray(saved.triggers) ? saved.triggers : [],
          activities: Array.isArray(saved.activities) ? saved.activities : [],
          notes: typeof saved.notes === "string" ? saved.notes : notes,
        }

        setEntries((prev) => {
          const copy = Array.isArray(prev) ? [...prev] : []
          const idx = copy.findIndex((e) => e.date === savedUi.date)
          if (idx >= 0) copy[idx] = savedUi
          else copy.push(savedUi)
          copy.sort((a, b) => a.date.localeCompare(b.date))
          return copy
        })
      }

      toast.success(res.status === 201 ? "Mood entry created" : "Mood entry updated")
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Failed to save mood entry")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id?: string) {
    if (!id) return
    try {
      setDeletingId(id)
      const res = await fetch(`/api/mood-entries?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete mood entry")
      }
      setEntries((prev) => (Array.isArray(prev) ? prev.filter((e) => e._id !== id) : []))
      toast.success("Mood entry deleted")
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Failed to delete mood entry")
    } finally {
      setDeletingId(null)
    }
  }

  const averageIntensity = useMemo(() => {
    const list = Array.isArray(entries) ? entries : []
    if (list.length === 0) return 0
    const sum = list.reduce((acc, e) => acc + (Number(e.intensity) || 0), 0)
    return Math.round((sum / list.length) * 10) / 10
  }, [entries])

  const intensityPercent = Math.round(((intensity - 1) / 9) * 100)

  return (
    <div className="flex-1 h-full overflow-auto p-4 md:p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card className="self-start card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Log your mood
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="mood">Mood</Label>
                  <select
                    id="mood"
                    className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                  >
                    {MOODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="intensity">Intensity: {intensity}</Label>
                <input
                  id="intensity"
                  type="range"
                  min={1}
                  max={10}
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="w-full mt-2 accent-cyan-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                </div>
                {/* Visual intensity bar */}
                <div className="mt-3 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 transition-all"
                    style={{ width: `${intensityPercent}%` }}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="triggers">Triggers (comma-separated)</Label>
                <Input
                  id="triggers"
                  placeholder="e.g. exam, workload"
                  value={triggersInput}
                  onChange={(e) => setTriggersInput(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="activities">Activities (comma-separated)</Label>
                <Input
                  id="activities"
                  placeholder="e.g. walk, journaling"
                  value={activitiesInput}
                  onChange={(e) => setActivitiesInput(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="How are you feeling? What happened today?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 text-white"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Mood
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading entries...
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-500">Average intensity:</span>
                  <Badge variant="secondary" className="text-sm rounded-full">
                    {averageIntensity}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-slate-500">Recent entries:</div>
                  <div className="space-y-2 max-h-[360px] overflow-auto pr-1 custom-scrollbar">
                    {(entries || [])
                      .slice()
                      .reverse()
                      .map((e) => (
                        <div
                          key={e._id ?? `${e.date}-${e.mood}`}
                          className="flex items-start justify-between gap-3 rounded-md border p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="rounded-full">
                                {e.date}
                              </Badge>
                              <Badge className="rounded-full">{e.mood}</Badge>
                              <Badge variant="secondary" className="rounded-full">
                                Intensity {e.intensity}
                              </Badge>
                            </div>
                            {(e.triggers || []).length > 0 && (
                              <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                                Triggers: {(e.triggers || []).join(", ")}
                              </div>
                            )}
                            {(e.activities || []).length > 0 && (
                              <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                Activities: {(e.activities || []).join(", ")}
                              </div>
                            )}
                            {e.notes && <div className="mt-1 text-xs text-slate-500 line-clamp-3">{e.notes}</div>}
                          </div>
                          {e._id && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => void handleDelete(e._id)}
                              disabled={deletingId === e._id}
                              className="shrink-0 hover:border-red-300"
                              title="Delete entry"
                            >
                              {deletingId === e._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4 text-red-600" />
                              )}
                            </Button>
                          )}
                        </div>
                      ))}
                    {(entries || []).length === 0 && (
                      <div className="text-sm text-slate-500">No mood entries yet. Log your first one!</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
