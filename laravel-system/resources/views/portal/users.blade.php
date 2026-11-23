@extends('layouts.app')
@section('title', 'EduPro User & Access Management')
@section('content')
<div class="mx-auto max-w-7xl space-y-6 px-4 py-8">
    <header><h1 class="text-3xl font-black text-slate-900">EduPro User & Access Management</h1><p class="mt-1 text-sm text-slate-600">Manage user provisioning, roles, account status and access within your permitted branch.</p></header>
    @if(session('status'))<p role="status" class="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{{ session('status') }}</p>@endif
    @if($errors->any())<ul class="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">@foreach($errors->all() as $error)<li>{{ $error }}</li>@endforeach</ul>@endif

    <form method="POST" action="{{ route('portal.users.store') }}" class="grid gap-3 rounded-2xl border bg-white p-5 md:grid-cols-3">@csrf
        <h2 class="md:col-span-3 text-lg font-bold">Secure account provisioning</h2>
        <input name="name" required maxlength="120" placeholder="Full name" class="rounded-lg border-slate-300">
        <input name="email" type="email" required placeholder="Email" class="rounded-lg border-slate-300">
        <input name="phone" placeholder="Phone" class="rounded-lg border-slate-300">
        <select name="role_id" required class="rounded-lg border-slate-300">@foreach($roles as $role)<option value="{{ $role->id }}">{{ $role->label }}</option>@endforeach</select>
        <input name="branch_id" type="number" placeholder="Branch ID (optional)" class="rounded-lg border-slate-300">
        <input name="password" type="password" minlength="12" required placeholder="Temporary password (12+ chars)" class="rounded-lg border-slate-300">
        <input name="password_confirmation" type="password" minlength="12" required placeholder="Confirm password" class="rounded-lg border-slate-300">
        <button class="rounded-lg bg-slate-900 px-4 py-2 font-bold text-white">Create account</button>
    </form>

    <form method="GET" class="flex gap-2"><label class="sr-only" for="user-search">Search users</label><input id="user-search" name="q" value="{{ request('q') }}" placeholder="Search name, email or student code" class="w-full rounded-lg border-slate-300"><button class="rounded-lg border px-4 font-bold">Search</button></form>
    <div class="overflow-x-auto rounded-2xl border bg-white"><table class="w-full text-left text-sm"><thead class="bg-slate-50 text-slate-600"><tr><th class="p-3">Account</th><th>Branch</th><th>Roles</th><th>Status</th><th>Controls</th></tr></thead><tbody>
        @foreach($users as $account)<tr class="border-t align-top"><td class="p-3"><strong>{{ $account->name }}</strong><br><span class="text-slate-500">{{ $account->email }}</span><br><span class="text-xs text-slate-500">{{ $account->student_code ?? $account->roll_number }}</span></td><td>{{ $account->branch?->name ?? '—' }}</td><td>{{ $account->roles->pluck('label')->push(ucfirst($account->role))->unique()->join(', ') }}</td><td>{{ ucfirst($account->account_status ?? 'active') }}</td><td class="min-w-64 space-y-2 p-3">
            <form method="POST" action="{{ route('portal.users.status', $account) }}" class="flex gap-2">@csrf @method('PATCH')<select name="account_status" class="rounded border-slate-300 text-xs"><option>active</option><option>inactive</option><option>suspended</option></select><input name="reason" placeholder="Reason (suspension)" class="min-w-0 rounded border-slate-300 text-xs"><button class="rounded bg-amber-100 px-2 py-1 text-xs font-bold">Update</button></form>
            <form method="POST" action="{{ route('portal.users.roles.assign', $account) }}" class="flex gap-2">@csrf<select name="role_id" class="rounded border-slate-300 text-xs">@foreach($roles as $role)<option value="{{ $role->id }}">{{ $role->label }}</option>@endforeach</select><button class="rounded bg-indigo-100 px-2 py-1 text-xs font-bold">Assign role</button></form>
        </td></tr>@endforeach
    </tbody></table></div>
    {{ $users->links() }}
</div>
@endsection
