import { createFileRoute } from '@tanstack/solid-router'

export const Route = createFileRoute('/api/v1/agent')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/api/agent"!</div>
}
