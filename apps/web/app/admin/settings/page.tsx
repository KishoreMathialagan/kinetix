'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, Input, Label, Skeleton, Switch, toast } from '@kinetix/ui'
import { PageHeader } from '@kinetix/ui'
import { getSettings, updateSettings } from '@/services/admin'
import { toApiError } from '@/lib/api-client'
import { useState } from 'react'

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-sm">{label}</Label>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient()
  const [debug, setDebug] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)

  const query = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: getSettings,
  })

  const settings = query.data

  async function handleDebugChange(value: boolean) {
    setDebug(value)
    setSaving(true)
    try {
      await updateSettings({ debug: value })
      toast.success('Settings updated')
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
    } catch (error) {
      toast.error(toApiError(error).message)
      setDebug(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Clinic and system settings" />
      <div className="grid gap-6 lg:max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Application</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings ? (
              <>
                <Field label="Application name" value={String(settings.app_name ?? '—')} />
                <Field label="Default page size" value={String(settings.page_size_default ?? '—')} />
                <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                  <div className="space-y-1">
                    <Label className="text-sm">Debug mode</Label>
                    <p className="text-xs text-muted-foreground">Enable verbose error responses (not persisted in MVP).</p>
                  </div>
                  <Switch
                    checked={debug ?? settings.debug === true}
                    disabled={saving}
                    onCheckedChange={handleDebugChange}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
