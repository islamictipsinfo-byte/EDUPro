@extends('layouts.app')
@section('title', 'EduPro Notices')
@section('content')
<div class="mx-auto max-w-4xl space-y-4 px-4 py-8"><h1 class="text-3xl font-black">EduPro Notices</h1>@if(session('status'))<p role="status" class="rounded bg-emerald-50 p-3 text-emerald-800">{{ session('status') }}</p>@endif @forelse($notices as $notice)<article class="rounded-2xl border bg-white p-5"><h2 class="text-xl font-bold">{{ $notice->title }}</h2><p class="mt-2 whitespace-pre-line text-slate-700">{{ $notice->body }}</p><p class="mt-2 text-xs text-slate-500">{{ $notice->published_at->format('M d, Y H:i') }}</p><form method="POST" action="{{ route('portal.workspace.notices.read', $notice) }}">@csrf<button class="mt-3 text-sm font-bold text-cyan-800 underline">Mark as read</button></form></article>@empty<p>No current notices.</p>@endforelse{{ $notices->links() }}</div>
@endsection
