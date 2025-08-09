import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-border">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-foreground">Project Nexus</Link>
          <div className="flex items-center gap-2">
            <Link href="/login/student"><Button variant="secondary" size="sm">Student</Button></Link>
            <Link href="/login/teacher"><Button variant="secondary" size="sm">Teacher</Button></Link>
            <Link href="/login/admin"><Button size="sm">Admin</Button></Link>
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
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground">
              Project Nexus
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              A streamlined project management system for colleges — submit, review, and grade with ease.
            </p>
      <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login/student"><Button size="lg">Student Login</Button></Link>
              <Link href="/login/teacher"><Button variant="secondary" size="lg">Teacher Login</Button></Link>
              <Link href="/login/admin"><Button variant="outline" size="lg">Admin</Button></Link>
            </div>
          </div>
        </div>
      </section>
      <section className="container mx-auto px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          <Card><CardContent className="p-6"><h3 className="text-lg font-medium text-card-foreground">For Students</h3><p className="mt-2 text-sm text-muted-foreground">Submit your project links, track statuses, and view feedback.</p></CardContent></Card>
          <Card><CardContent className="p-6"><h3 className="text-lg font-medium text-card-foreground">For Teachers</h3><p className="mt-2 text-sm text-muted-foreground">Review submissions, grade efficiently, and manage feedback.</p></CardContent></Card>
          <Card><CardContent className="p-6"><h3 className="text-lg font-medium text-card-foreground">For Admins</h3><p className="mt-2 text-sm text-muted-foreground">Create users, enforce policies, and oversee departments.</p></CardContent></Card>
        </div>
      </section>
    </main>
  );
}
