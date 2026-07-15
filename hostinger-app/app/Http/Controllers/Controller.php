<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

abstract class Controller
{
    /** @return array{role:string,id:?int,name:?string,exp:int} */
    protected function session(Request $request): array
    {
        return $request->attributes->get('session');
    }
}
