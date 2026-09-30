<?php

namespace Database\Seeders;

use App\Enums\InventoryMode;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\ItemType;
use App\Models\Laboratory;
use App\Models\StorageLocation;
use App\Models\Unit;
use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        $laboratories = collect([
            ['code' => 'MIKRO', 'name' => 'Mikrobiologi'],
            ['code' => 'KAIR', 'name' => 'Kimia Air'],
            ['code' => 'KUDR', 'name' => 'Kimia Udara'],
            ['code' => 'SAMP', 'name' => 'Sampling'],
            ['code' => 'QAQC', 'name' => 'QA/QC'],
        ])->map(fn (array $data): Laboratory => Laboratory::updateOrCreate(['code' => $data['code']], $data + ['is_active' => true]));

        $units = collect([
            ['name' => 'Gram', 'symbol' => 'g'], ['name' => 'Milligram', 'symbol' => 'mg'],
            ['name' => 'Kilogram', 'symbol' => 'kg'], ['name' => 'Milliliter', 'symbol' => 'mL'],
            ['name' => 'Liter', 'symbol' => 'L'], ['name' => 'Piece', 'symbol' => 'pcs'],
            ['name' => 'Bottle', 'symbol' => 'bottle'], ['name' => 'Pack', 'symbol' => 'pack'],
            ['name' => 'Kit', 'symbol' => 'kit'],
        ])->mapWithKeys(function (array $data): array {
            $unit = Unit::updateOrCreate(['symbol' => $data['symbol']], $data + ['is_active' => true]);

            return [$data['symbol'] => $unit];
        });

        $types = collect(['Media', 'Reagen', 'Consumable', 'Standard / Control', 'Bioindikator', 'Kit / Test Kit', 'Equipment', 'Other'])
            ->mapWithKeys(function (string $name): array {
                $type = ItemType::updateOrCreate(['name' => $name], ['is_active' => true]);

                return [$name => $type];
            });

        $categories = [];
        foreach ([
            ['Media', 'Media Agar'], ['Media', 'Media Cair'],
            ['Consumable', 'General Lab'], ['Consumable', 'Sampling'], ['Consumable', 'Filtration'],
            ['Reagen', 'Reagen Mikrobiologi'], ['Standard / Control', 'Kontrol Mikrobiologi'],
            ['Bioindikator', 'Bioindikator'], ['Kit / Test Kit', 'Kit Mikrobiologi'],
        ] as [$typeName, $name]) {
            $categories[$name] = ItemCategory::updateOrCreate(
                ['item_type_id' => $types[$typeName]->id, 'name' => $name],
                ['is_active' => true],
            );
        }

        $items = [
            ...array_map(fn (string $name): array => [$name, 'Media', 'Media Agar', null, InventoryMode::None], [
                'Plate Count Agar', 'Chromogenic Coliform Agar', 'Simmons Citrate', 'Nutrient Agar',
                'Triptose Soy Agar', 'Malt Extract Agar', 'Glucose Agar', 'Endo Agar', 'TSIA',
                'XLD Agar', 'RVS', 'PDA',
            ]),
            ...array_map(fn (string $name): array => [$name, 'Media', 'Media Cair', null, InventoryMode::None], [
                'Lauryl Triptose Broth', 'Brilliant Green Lactose Bile Broth', 'Pepton Water',
                'Tryptopan Medium', 'EC Broth', 'EC MUG', 'MacConkey', 'Buffer Pepton Water',
                'MRVP Medium', 'MKTTn',
            ]),
            ['Membran Filter', 'Consumable', 'Filtration', 'pcs', InventoryMode::Stock],
            ['Bioendo Rapid Endotoxin 0,25 EU', 'Kit / Test Kit', 'Kit Mikrobiologi', null, InventoryMode::None],
            ['Endotoxin Free Sample Bottle', 'Consumable', 'Sampling', 'pcs', InventoryMode::Stock],
            ['Bioindikator Geobacillus stearothermophilus', 'Bioindikator', 'Bioindikator', null, InventoryMode::None],
            ['Bioindikator Bacillus atrophaeus', 'Bioindikator', 'Bioindikator', null, InventoryMode::None],
            ['Gram Stain Kit', 'Kit / Test Kit', 'Kit Mikrobiologi', null, InventoryMode::None],
            ['Nesco Transport Swab Test', 'Kit / Test Kit', 'Kit Mikrobiologi', null, InventoryMode::None],
            ['Disposable Loop (Ose Steril)', 'Consumable', 'General Lab', 'pcs', InventoryMode::Stock],
            ['Control Standard Endotoksin', 'Standard / Control', 'Kontrol Mikrobiologi', null, InventoryMode::None],
            ['Chloramphenicol Supplement', 'Reagen', 'Reagen Mikrobiologi', null, InventoryMode::None],
            ['Sitokrom Oksidase Shimadzu', 'Reagen', 'Reagen Mikrobiologi', null, InventoryMode::None],
            ['Oksidase Disc', 'Reagen', 'Reagen Mikrobiologi', 'pcs', InventoryMode::Stock],
            ['Indikator McFarland', 'Standard / Control', 'Kontrol Mikrobiologi', null, InventoryMode::None],
            ['Kovacs', 'Reagen', 'Reagen Mikrobiologi', null, InventoryMode::None],
            ['Syringe', 'Consumable', 'General Lab', 'pcs', InventoryMode::Stock],
        ];

        $microbiology = $laboratories->firstWhere('code', 'MIKRO');
        foreach ($items as $index => [$name, $typeName, $categoryName, $symbol, $mode]) {
            if (! isset($categories[$categoryName])) {
                throw new \LogicException("Kategori {$categoryName} belum dibuat.");
            }
            $item = Item::updateOrCreate(['name' => $name], [
                'code' => sprintf('MIK-%03d', $index + 1),
                'item_type_id' => $types[$typeName]->id,
                'category_id' => $categories[$categoryName]->id,
                'default_unit_id' => $symbol ? $units[$symbol]->id : null,
                'inventory_mode' => $mode,
                'is_active' => true,
            ]);
            $item->laboratories()->syncWithoutDetaching([$microbiology->id]);
        }

        foreach ([['Lemari Media A', 'MEDIA-A'], ['Lemari Reagen', 'REAGEN'], ['Refrigerator 1', 'REF-1'], ['Freezer', 'FREEZER']] as [$name, $code]) {
            StorageLocation::updateOrCreate(
                ['laboratory_id' => $microbiology->id, 'name' => $name],
                ['code' => $code, 'is_active' => true],
            );
        }
    }
}
