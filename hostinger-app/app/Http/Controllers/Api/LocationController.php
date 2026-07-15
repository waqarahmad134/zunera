<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmployeeLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    /** Only active employees who have shared a location at least once. */
    public function index(): JsonResponse
    {
        $locations = EmployeeLocation::with('employee')
            ->whereHas('employee', fn ($q) => $q->where('status', 'active'))
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (EmployeeLocation $l) => [
                'employeeId' => $l->employee_id,
                'employeeName' => $l->employee->name,
                'employeeRole' => $l->employee->role,
                'employeePhone' => $l->employee->phone,
                'lat' => (float) $l->lat,
                'lng' => (float) $l->lng,
                'accuracy' => $l->accuracy !== null ? (float) $l->accuracy : null,
                'updatedAt' => $l->updated_at,
            ]);

        return response()->json(['locations' => $locations]);
    }

    // Employee's own device posts its location periodically while the
    // staff app is open. employeeId comes strictly from the verified
    // session.
    public function store(Request $request): JsonResponse
    {
        $session = $this->session($request);

        $lat = $request->input('lat');
        $lng = $request->input('lng');
        $accuracy = $request->input('accuracy');

        if (!is_numeric($lat) || (float) $lat < -90 || (float) $lat > 90 || !is_numeric($lng) || (float) $lng < -180 || (float) $lng > 180) {
            return response()->json(['error' => 'Invalid coordinates.'], 400);
        }

        EmployeeLocation::updateOrCreate(
            ['employee_id' => $session['id']],
            [
                'lat' => (float) $lat,
                'lng' => (float) $lng,
                'accuracy' => is_numeric($accuracy) ? (float) $accuracy : null,
            ]
        );

        return response()->json(['ok' => true]);
    }
}
