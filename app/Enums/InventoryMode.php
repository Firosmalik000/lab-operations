<?php

namespace App\Enums;

enum InventoryMode: string
{
    case None = 'NONE';
    case Stock = 'STOCK';
    case Asset = 'ASSET';
}
