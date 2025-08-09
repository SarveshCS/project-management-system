import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-border">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-foreground cursor-pointer">Project Nexus</Link>
          <div className="flex items-center gap-2">
            <Link href="/login"><Button size="sm">Login</Button></Link>
          </div>
        </div>
      </header>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        </div>
    <div className="container mx-auto px-6 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground">Project Nexus</h1>
            <p className="mt-4 text-lg text-muted-foreground">A project management system for colleges. Submit, review, and grade with ease.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login"><Button size="lg">Login</Button></Link>
            </div>
          </div>
        </div>
      </section>
      <section className="container mx-auto px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-card-foreground">Simple submission</h3>
              <p className="mt-2 text-sm text-muted-foreground">Students share work in one place and get updates without confusion.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-card-foreground">Fast grading</h3>
              <p className="mt-2 text-sm text-muted-foreground">Teachers review and record grades with clean flows and clear context.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-card-foreground">Role based access</h3>
              <p className="mt-2 text-sm text-muted-foreground">Admins manage users and data with rules that keep access in control.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
