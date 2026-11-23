@extends('layouts.app')
@section('title', 'EduPro Dashboard')
@section('content')
@php
    $layoutById = collect($layout)->keyBy('id');
    $activeWidgetIds = collect($layout)->where('visible', true)->pluck('id');
@endphp
<div class="mx-auto max-w-7xl space-y-6 px-4 py-8" id="edupro-dashboard">
    <header class="rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div class="flex flex-wrap items-start justify-between gap-5">
            <div>
                <p class="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">EduPro · {{ str_replace('_', ' ', $user->role) }} workspace</p>
                <h1 class="mt-2 text-3xl font-black">Welcome back, {{ $user->name }}</h1>
                <p class="mt-2 text-sm text-slate-300">Your learning operations, organized around your role.</p>
            </div>
            <a href="{{ route('portal.index') }}" class="rounded-xl border border-white/20 px-4 py-2 text-sm font-bold hover:bg-white/10">Open full portal</a>
        </div>
        <div class="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <label class="sr-only" for="global-search">Search EduPro</label>
            <div class="relative">
                <input id="global-search" type="search" autocomplete="off" placeholder="Search courses and people…" class="w-full rounded-xl border-0 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-300 focus:ring-2 focus:ring-cyan-300">
                <div id="search-results" class="absolute z-20 mt-2 hidden w-full rounded-xl bg-white p-2 text-slate-900 shadow-xl"></div>
            </div>
            <select id="dashboard-preset" class="rounded-xl border-0 bg-white px-4 py-3 text-sm font-bold text-slate-800" aria-label="Dashboard preset">
                @foreach($presets as $key => $keys)
                    <option value="{{ $key }}" @selected($preset === $key)>{{ ucfirst($key) }} preset</option>
                @endforeach
            </select>
            <div class="flex gap-2">
                <button id="save-dashboard" class="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-extrabold text-slate-950 hover:bg-cyan-200">Save layout</button>
                <button id="reset-dashboard" class="rounded-xl border border-white/20 px-4 py-3 text-sm font-bold hover:bg-white/10">Reset</button>
            </div>
        </div>
        <p id="dashboard-message" role="status" class="mt-3 min-h-5 text-xs text-cyan-100"></p>
    </header>

    <section class="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Widget controls">
        @foreach($widgets as $key => $widget)
            <label class="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" class="widget-toggle rounded border-slate-300 text-cyan-700" data-widget="{{ $key }}" @checked($layoutById->get($key)['visible'] ?? false)>
                {{ $widget['title'] }}
            </label>
        @endforeach
    </section>

    <section id="widget-grid" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Dashboard widgets">
        @foreach($widgets as $key => $widget)
            @php
                $item = $layoutById->get($key, ['visible' => false, 'size' => $widget['size'] ?? 'medium', 'order' => 99]);
                $visible = (bool) ($item['visible'] ?? false);
                $span = match($item['size'] ?? 'medium') { 'small' => 'md:col-span-1', 'large' => 'md:col-span-2 xl:col-span-3', default => 'md:col-span-1 xl:col-span-2' };
            @endphp
            <article draggable="true" data-widget-card="{{ $key }}" data-order="{{ $item['order'] ?? 99 }}" class="widget-card {{ $span }} {{ $visible ? '' : 'hidden' }} rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="{{ $widget['title'] }} widget">
                <div class="flex items-start justify-between gap-3">
                    <div><h2 class="font-extrabold text-slate-900">{{ $widget['title'] }}</h2><p class="mt-1 text-xs text-slate-500">{{ $widget['description'] }}</p></div>
                    <label class="text-xs font-bold text-slate-500">Size
                        <select class="widget-size mt-1 block rounded-lg border-slate-200 py-1 text-xs" data-widget="{{ $key }}" aria-label="{{ $widget['title'] }} size">
                            @foreach(['small', 'medium', 'large'] as $size)<option value="{{ $size }}" @selected(($item['size'] ?? 'medium') === $size)>{{ ucfirst($size) }}</option>@endforeach
                        </select>
                    </label>
                </div>
                <div class="widget-content mt-5" data-content="{{ $key }}">
                    @switch($key)
                        @case('overview')
                            <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                @foreach(['students' => 'Students', 'courses' => 'Courses', 'enrollments' => 'Enrollments', 'pending_enrollments' => 'Pending'] as $metric => $label)
                                    <div class="rounded-xl bg-slate-50 p-4"><p class="text-xs font-semibold text-slate-500">{{ $label }}</p><p class="mt-1 text-2xl font-black text-slate-900" data-metric="{{ $metric }}">{{ number_format($data[$metric]) }}</p></div>
                                @endforeach
                            </div>
                        @break
                        @case('revenue')
                            <p class="text-3xl font-black text-emerald-700">৳<span data-metric="revenue">{{ number_format($data['revenue'] ?? 0) }}</span></p><p class="mt-1 text-xs text-slate-500">Approved enrollment revenue</p>
                        @break
                        @case('enrollments')
                            <div class="flex items-end gap-3"><span class="text-4xl font-black text-indigo-700" data-metric="enrollments">{{ number_format($data['enrollments']) }}</span><span class="pb-1 text-sm text-slate-500">total</span></div><p class="mt-2 text-sm text-amber-700"><span data-metric="pending_enrollments">{{ number_format($data['pending_enrollments']) }}</span> awaiting review</p>
                        @break
                        @case('attendance')
                            <p class="text-4xl font-black text-sky-700" data-metric="attendance_today">{{ number_format($data['attendance_today']) }}</p><p class="mt-1 text-xs text-slate-500">Attendance records today</p>
                        @break
                        @case('performance')
                            <p class="text-4xl font-black text-violet-700"><span data-metric="average_performance">{{ number_format($data['average_performance'], 1) }}</span>%</p><p class="mt-1 text-xs text-slate-500">Average exam score</p>
                        @break
                        @case('my_courses')
                            <p class="text-3xl font-black text-indigo-700" data-metric="enrollments">{{ number_format($data['enrollments']) }}</p><p class="mt-1 text-xs text-slate-500">Courses and learning paths available to your account</p><a class="mt-4 inline-block text-sm font-bold text-cyan-800 underline" href="{{ route('learn') }}">Continue learning</a>
                        @break
                        @case('activity')
                            <ul class="divide-y divide-slate-100" data-activity-list>
                                @forelse($data['activity'] as $event)<li class="flex justify-between gap-4 py-3 text-sm"><span class="font-semibold text-slate-800">{{ str_replace('_', ' ', $event->action) }}</span><time class="shrink-0 text-xs text-slate-500">{{ \Illuminate\Support\Carbon::parse($event->created_at)->diffForHumans() }}</time></li>
                                @empty<li class="py-3 text-sm text-slate-500">No recent activity has been recorded.</li>@endforelse
                            </ul>
                        @break
                        @case('system_health')
                            <div class="space-y-3 text-sm"><p><span class="mr-2 inline-block h-2.5 w-2.5 rounded-full {{ $data['system']['database'] ? 'bg-emerald-500' : 'bg-rose-500' }}"></span>Database {{ $data['system']['database'] ? 'connected' : 'unavailable' }}</p><p><span class="mr-2 inline-block h-2.5 w-2.5 rounded-full {{ $data['system']['storage_writable'] ? 'bg-emerald-500' : 'bg-rose-500' }}"></span>Storage {{ $data['system']['storage_writable'] ? 'writable' : 'not writable' }}</p><p class="text-xs text-slate-500">Environment: {{ $data['system']['environment'] }}</p></div>
                        @break
                        @case('widget_usage')
                            <ul class="space-y-2">@forelse($data['widget_usage'] as $usage)<li class="flex justify-between text-sm"><span>{{ str_replace('_', ' ', $usage->widget_key) }}</span><strong>{{ number_format($usage->total_views) }}</strong></li>@empty<li class="text-sm text-slate-500">Usage data will appear as the team uses widgets.</li>@endforelse</ul>
                        @break
                        @case('quick_actions')
                            <div class="flex flex-wrap gap-2"><a href="{{ route('courses.index') }}" class="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold hover:bg-slate-200">Browse courses</a><a href="{{ route('learn') }}" class="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold hover:bg-slate-200">My learning</a><a href="{{ route('portal.index') }}" class="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold hover:bg-slate-200">Open portal</a></div>
                        @break
                    @endswitch
                </div>
            </article>
        @endforeach
    </section>
    <p class="text-right text-xs text-slate-500">Auto-refreshes every 30 seconds · Updated <time id="dashboard-updated">{{ \Illuminate\Support\Carbon::parse($data['updated_at'])->format('H:i:s') }}</time></p>
</div>

<script>
(() => {
    const root = document.getElementById('edupro-dashboard');
    const grid = document.getElementById('widget-grid');
    const message = document.getElementById('dashboard-message');
    const preset = document.getElementById('dashboard-preset');
    const csrf = document.querySelector('meta[name="csrf-token"]')?.content || '{{ csrf_token() }}';
    const cards = () => [...grid.querySelectorAll('[data-widget-card]')];
    const layout = () => cards().map((card, order) => ({
        id: card.dataset.widgetCard,
        visible: !card.classList.contains('hidden'),
        size: card.querySelector('.widget-size').value,
        order,
    }));
    const showMessage = text => { message.textContent = text; setTimeout(() => message.textContent = '', 3500); };
    const applyVisibility = (id, visible) => {
        const card = grid.querySelector(`[data-widget-card="${id}"]`);
        if (card) card.classList.toggle('hidden', !visible);
    };

    document.querySelectorAll('.widget-toggle').forEach(toggle => toggle.addEventListener('change', () => applyVisibility(toggle.dataset.widget, toggle.checked)));
    document.querySelectorAll('.widget-size').forEach(select => select.addEventListener('change', () => {
        const card = grid.querySelector(`[data-widget-card="${select.dataset.widget}"]`);
        card.classList.remove('md:col-span-1', 'xl:col-span-2', 'xl:col-span-3');
        const spans = { small: ['md:col-span-1'], medium: ['md:col-span-1', 'xl:col-span-2'], large: ['md:col-span-2', 'xl:col-span-3'] };
        card.classList.add(...spans[select.value]);
    }));

    let dragged = null;
    cards().forEach(card => {
        card.addEventListener('dragstart', () => { dragged = card; card.classList.add('opacity-40'); });
        card.addEventListener('dragend', () => { card.classList.remove('opacity-40'); dragged = null; });
        card.addEventListener('dragover', event => event.preventDefault());
        card.addEventListener('drop', event => {
            event.preventDefault();
            if (dragged && dragged !== card) grid.insertBefore(dragged, card);
        });
    });

    preset.addEventListener('change', () => {
        const presets = @json($presets);
        const visible = new Set(presets[preset.value] || []);
        document.querySelectorAll('.widget-toggle').forEach(toggle => {
            toggle.checked = visible.has(toggle.dataset.widget);
            applyVisibility(toggle.dataset.widget, toggle.checked);
        });
    });

    document.getElementById('save-dashboard').addEventListener('click', async () => {
        const response = await fetch('{{ route('portal.dashboard.layout.save') }}', {
            method: 'PUT', headers: {'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrf},
            body: JSON.stringify({preset: preset.value, layout: layout()}),
        });
        const result = await response.json(); showMessage(result.message || (response.ok ? 'Saved.' : 'Could not save layout.'));
    });
    document.getElementById('reset-dashboard').addEventListener('click', async () => {
        const response = await fetch('{{ route('portal.dashboard.layout.reset') }}', {method: 'DELETE', headers: {'Accept': 'application/json', 'X-CSRF-TOKEN': csrf}});
        if (response.ok) window.location.reload(); else showMessage('Could not reset dashboard.');
    });

    const search = document.getElementById('global-search');
    const results = document.getElementById('search-results');
    let searchTimer;
    search.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(async () => {
            if (search.value.trim().length < 2) { results.classList.add('hidden'); return; }
            const response = await fetch(`{{ route('portal.dashboard.search') }}?q=${encodeURIComponent(search.value)}`, {headers: {'Accept': 'application/json'}});
            const payload = await response.json();
            results.innerHTML = '';
            payload.results.forEach(item => {
                const link = document.createElement('a'); link.href = item.url;
                link.className = 'block rounded-lg px-3 py-2 text-sm hover:bg-slate-100';
                link.textContent = `${item.type}: ${item.label}`; results.appendChild(link);
            });
            if (!payload.results.length) results.textContent = 'No results';
            results.classList.remove('hidden');
        }, 250);
    });

    const refresh = async () => {
        try {
            const response = await fetch('{{ route('portal.dashboard.data') }}', {headers: {'Accept': 'application/json'}});
            if (!response.ok) return;
            const data = await response.json();
            Object.entries(data).forEach(([key, value]) => {
                const target = document.querySelector(`[data-metric="${key}"]`);
                if (target && value !== null && typeof value !== 'object') target.textContent = key === 'average_performance' ? Number(value).toFixed(1) : Number(value).toLocaleString();
            });
            document.getElementById('dashboard-updated').textContent = new Date(data.updated_at).toLocaleTimeString();
        } catch (_) { /* Keep the last successfully rendered data if temporarily offline. */ }
    };
    window.setInterval(refresh, 30000);
})();
</script>
@endsection
