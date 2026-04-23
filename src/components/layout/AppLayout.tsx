import { Outlet } from 'react-router-dom'

export default function AppLayout() {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-white">
      <main className="pb-20">
        <Outlet />
      </main>
    </div>
  )
}
