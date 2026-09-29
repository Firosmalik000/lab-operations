<?php

namespace App\Enums;

enum MaterialUsageStatus: string
{
    case Draft = 'DRAFT';
    case Submitted = 'SUBMITTED';
    case Voided = 'VOIDED';
}
