<?php

namespace App\Enums;

enum StockMovementType: string
{
    case Opening = 'OPENING';
    case Receiving = 'RECEIVING';
    case Usage = 'USAGE';
    case AdjustmentIn = 'ADJUSTMENT_IN';
    case AdjustmentOut = 'ADJUSTMENT_OUT';
    case Return = 'RETURN';
    case Disposal = 'DISPOSAL';
    case TransferIn = 'TRANSFER_IN';
    case TransferOut = 'TRANSFER_OUT';
    case Reversal = 'REVERSAL';
}
