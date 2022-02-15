import { getConfig } from 'erxes-api-utils'


export const getPureDate = (date: Date) => {
  const ndate = new Date(date);
  const diffTimeZone = ndate.getTimezoneOffset() * 1000 * 60;
  return new Date(ndate.getTime() - diffTimeZone)
}

export const getFullDate = (date: Date) => {
  const ndate = getPureDate(date)
  const year = ndate.getFullYear();
  const month = ndate.getMonth();
  const day = ndate.getDate();

  const today = new Date(year, month, day);
  today.setHours(0, 0, 0, 0)
  return today;
}

export const getTomorrow = (date: Date) => {
  return getFullDate(new Date(date.getTime() + 24 * 60 * 60 * 1000))
}

export const orderToErkhet = async (models, messageBroker, memoryStorage, pos, orderId, putResId) => {
  let erkhetConfig = await getConfig(models, memoryStorage, 'ERKHET', {});

  if (!erkhetConfig || !erkhetConfig.apiKey! || !erkhetConfig.apiSecret || !pos.erkhetConfig || !pos.erkhetConfig.isSyncErkhet) {
    return;
  }

  const order = await models.PosOrders.findOne({ _id: orderId }).lean();
  const putRes = await models.PutResponses.findOne({ _id: putResId }).lean();

  const details = [];

  const workerEmail = order.userId && (await models.Users.findOne({ _id: order.userId }).lean() || {}).email || '';

  const productsIds = order.items.map(item => item.productId);
  const products = await models.Products.find({ _id: { $in: productsIds } });

  const productCodeById = {};
  for (const product of products) {
    productCodeById[product._id] = product.code;
  }

  let sumSaleAmount = 0;

  for (const item of order.items) {
    // if wrong productId then not sent
    if (!productCodeById[item.productId]) {
      continue;
    }

    const amount = item.count * item.unitPrice;
    sumSaleAmount += amount;
    details.push({
      count: item.count,
      amount,
      discount: item.discountAmount,
      inventoryCode: productCodeById[item.productId],
      workerEmail,
    });
  }

  const payments: any = {};

  if (order.cashAmount) {
    payments.cashAmount = order.cashAmount;
    sumSaleAmount -= order.cashAmount;
  }
  if (order.cardAmount) {
    payments.cardAmount = order.cardAmount;
    sumSaleAmount -= order.cardAmount;
  }
  if (order.mobileAmount) {
    payments.mobileAmount = order.mobileAmount;
    sumSaleAmount -= order.mobileAmount;
  }

  if (sumSaleAmount > 0.005) {
    payments[pos.erkhetConfig.defaultPay] = sumSaleAmount;
  }

  const orderInfos = [
    {
      date: getPureDate(order.paidDate).toISOString().slice(0, 10),
      orderId: order._id,
      hasVat: putRes.vat ? true : false,
      hasCitytax: putRes.citytax ? true : false,
      billType: order.billType,
      customerCode: (await models.Customers.findOne({ _id: order.customerId }) || {}).code,
      description: `${pos.name}`,
      number: `${pos.erkhetConfig.beginNumber || ''}${order.number}`,
      details,
      ...payments,
    },
  ];

  let userEmail = pos.erkhetConfig.userEmail;

  const postData = {
    userEmail,
    token: erkhetConfig.apiToken,
    apiKey: erkhetConfig.apiKey,
    apiSecret: erkhetConfig.apiSecret,
    orderInfos: JSON.stringify(orderInfos),
  }

  const apiResponse = await messageBroker().sendRPCMessage('rpc_queue:erxes-automation-erkhet', {
    action: 'get-response-send-order-info',
    isJson: true,
    isEbarimt: false,
    payload: JSON.stringify(postData),
  });

  if (apiResponse) {
    if (apiResponse.success) {
      await models.PosOrders.updateOne({ _id: orderId }, { syncedErkhet: true });
    }
    if (apiResponse.message) {
      throw new Error(apiResponse.message)
    }

  }
}

export const orderDeleteToErkhet = async (models, messageBroker, memoryStorage, pos, orderId) => {
  let erkhetConfig = await getConfig(models, memoryStorage, 'ERKHET', {});

  if (!erkhetConfig || !erkhetConfig.apiKey! || !erkhetConfig.apiSecret || !pos.erkhetConfig.isSyncErkhet) {
    return;
  }

  const order = await models.PosOrders.findOne({ _id: orderId }).lean();

  const orderInfos = [{
    date: order.paidDate,
    orderId: order._id,
    returnKind: 'hard'
  }];

  let userEmail = pos.erkhetConfig.userEmail

  const postData = {
    userEmail,
    token: erkhetConfig.apiToken,
    apiKey: erkhetConfig.apiKey,
    apiSecret: erkhetConfig.apiSecret,
    orderInfos: JSON.stringify(orderInfos),
  }

  const apiResponse = await messageBroker().sendRPCMessage('rpc_queue:erxes-automation-erkhet', {
    action: 'get-response-return-order',
    isJson: true,
    isEbarimt: false,
    payload: JSON.stringify(postData),
  });

  if (apiResponse) {
    if (apiResponse.success) {
      return apiResponse.success
    } else {
      throw new Error(apiResponse)
    }

  }
}
