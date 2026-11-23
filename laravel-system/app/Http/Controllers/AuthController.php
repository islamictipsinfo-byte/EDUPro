<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function showLogin()
    {
        $branches = Branch::where('status', 'active')->get();
        return view('auth.login', compact('branches'));
    }

    public function login(Request $request)
    {
        $credentials = $request->validate(['email' => 'required|email', 'password' => 'required|string']);
        $candidate = User::where('email', $credentials['email'])->first();
        $allowed = $candidate && ($candidate->account_status ?? 'active') === 'active';
        $success = $allowed && Auth::attempt($credentials, $request->boolean('remember'));

        if (Schema::hasTable('user_login_history')) {
            DB::table('user_login_history')->insert([
                'user_id' => $candidate?->id, 'email' => $credentials['email'], 'successful' => (bool) $success,
                'ip_address' => $request->ip(), 'user_agent' => $request->userAgent(), 'created_at' => now(),
            ]);
        }

        if ($success) {
            $request->session()->regenerate();
            return redirect()->intended(route('portal.dashboard.index'));
        }

        return back()->withErrors(['email' => 'Invalid credentials or inactive account.'])->onlyInput('email');
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:120', 'email' => 'required|email|max:190|unique:users,email',
            'phone' => 'required|string|max:30', 'role' => 'required|in:student,guardian',
            'branch_id' => 'required|exists:branches,id', 'student_roll_link' => 'nullable|string|max:40',
            'password' => ['required', 'confirmed', Password::min(12)->letters()->mixedCase()->numbers()],
        ]);

        $user = DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'], 'email' => $data['email'], 'phone' => $data['phone'],
                'role' => $data['role'], 'branch_id' => $data['branch_id'],
                'roll_number' => $data['role'] === 'student' ? 'EDU-' . strtoupper(bin2hex(random_bytes(4))) : null,
                'student_code' => $data['role'] === 'student' ? 'EDU-' . strtoupper(bin2hex(random_bytes(4))) : null,
                'password' => Hash::make($data['password']), 'account_status' => 'active',
            ]);

            if ($data['role'] === 'guardian' && !empty($data['student_roll_link'])) {
                $student = User::where('role', 'student')->where('branch_id', $data['branch_id'])
                    ->where(fn ($query) => $query->where('roll_number', strtoupper($data['student_roll_link']))->orWhere('student_code', strtoupper($data['student_roll_link'])))
                    ->first();
                if ($student) $user->linkedStudents()->syncWithoutDetaching([$student->id]);
            }
            return $user;
        });

        Auth::login($user);
        $request->session()->regenerate();
        return redirect()->route('portal.dashboard.index');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('home');
    }
}
