import DashboardController from './DashboardController'
import MaterialUsageController from './MaterialUsageController'
import InventoryController from './InventoryController'
import ItemController from './ItemController'
import MasterDataController from './MasterDataController'
import ReportController from './ReportController'
import AuditLogController from './AuditLogController'
import UserAdministrationController from './UserAdministrationController'
import RoleAdministrationController from './RoleAdministrationController'
import Settings from './Settings'
const Controllers = {
    DashboardController: Object.assign(DashboardController, DashboardController),
MaterialUsageController: Object.assign(MaterialUsageController, MaterialUsageController),
InventoryController: Object.assign(InventoryController, InventoryController),
ItemController: Object.assign(ItemController, ItemController),
MasterDataController: Object.assign(MasterDataController, MasterDataController),
ReportController: Object.assign(ReportController, ReportController),
AuditLogController: Object.assign(AuditLogController, AuditLogController),
UserAdministrationController: Object.assign(UserAdministrationController, UserAdministrationController),
RoleAdministrationController: Object.assign(RoleAdministrationController, RoleAdministrationController),
Settings: Object.assign(Settings, Settings),
}

export default Controllers