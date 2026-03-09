select
    t.id as purchaseorderId,
    t.transactionnumber as transactionnumber,
    t.status as status,
    tl.id,
    tl.item as itemId,
    i.fullname as name,
    tl.quantity,
    tl.netamount as amount,
    tl.memo,
    ncmItem.custrecord_fte_itemcode_t_code,
    tl.quantitybilled,
    i.isfulfillable,
    tl.rate
from
    transaction as t
    inner join transactionstatus ts ON t.status = ts.id
    and t.type = ts.trantype
    inner join vendor as v on v.id = t.entity
    and v.custentity_brl_entity_t_fed_tax_reg = '37.608.062/0001-90'
    inner join transactionline as tl on(
        t.id = tl.transaction
        AND tl.mainline = 'F'
        AND tl.taxline = 'F'
        AND tl.item is not null
        AND tl.isclosed = 'F'
        AND (
            tl.rate = 27.1
            OR tl.netamount = 27.1
        )
    )
    inner join subsidiary as s on s.id = tl.subsidiary
    and s.custrecord_brl_subsd_t_fed_tx_reg = '39.520.039/0001-75'
    inner join item as i on(tl.item = i.id)
    left outer join customrecord_fte_itemcode as ncmItem on(i.custitem_fte_item_l_itemcode = ncmItem.id)
where
    recordtype = 'purchaseorder' -- AND t.id = 801 
    AND (
        approvalstatus = 2
        OR approvalstatus IS NULL
    )
    AND status != 'PurchOrd:H'
    AND t.entity = v.id